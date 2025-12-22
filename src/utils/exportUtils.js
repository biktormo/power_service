// src/utils/exportUtils.js

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { utils, writeFile } from 'xlsx';
import { PILARES_ORDER } from './ordering.js';

// No es necesario el logo aquí, ya que lo pasaremos como parámetro si existe.
// const logoBase64 = "data:image/png;base64,...";

// Función auxiliar para convertir imágenes de URL a Base64 para el PDF
const imageToBase64 = (url) => {
    return new Promise(async (resolve, reject) => {
        try {
            // Usamos un proxy CORS público. Para producción se recomienda uno propio.
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }
            const blob = await response.blob();
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        } catch (error) {
            console.error(`Error fetching image from ${url}:`, error);
            reject(error);
        }
    });
};

// --- FUNCIÓN PARA AUDITORÍAS PS ---
export const exportToPDF = async (audit, checklist, logoBase64) => {
    if (!audit) {
        alert("Por favor, selecciona una auditoría para exportar.");
        return;
    }

    const doc = new jsPDF();
    if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', 150, 8, 45, 15);
    }
    doc.setFontSize(18);
    doc.text(`Auditoría: ${audit.numeroAuditoria}`, 14, 22);
    doc.setFontSize(11);
    doc.text(`Lugar: ${audit.lugar}`, 14, 30);
    doc.text(`Auditores: ${audit.auditores.join(', ')}`, 14, 36);
    doc.text(`Auditados: ${audit.auditados.join(', ')}`, 14, 42);
    doc.text(`Fecha Inicio: ${audit.fechaCreacion.toDate().toLocaleDateString()}`, 14, 48);
    doc.text(`Fecha Cierre: ${audit.fechaCierre ? audit.fechaCierre.toDate().toLocaleDateString() : 'Abierta'}`, 14, 54);

    const tableColumns = ["Requisito", "Descripción", "Resultado", "Comentarios"];
    const tableData = [];
    PILARES_ORDER.forEach(pilarId => {
        const pilar = checklist[pilarId];
        if (!pilar) return;
        tableData.push([{ content: `--- PILAR: ${pilar.nombre} (${pilar.id}) ---`, colSpan: 4, styles: { fontStyle: 'bold', fillColor: [220, 220, 220] } }]);
        Object.values(pilar.estandares).forEach(estandar => {
            tableData.push([{ content: `Estándar: ${estandar.descripcion} (${estandar.id})`, colSpan: 4, styles: { fontStyle: 'italic', fillColor: [240, 240, 240] } }]);
            estandar.requisitos.forEach(req => {
                const result = audit.resultados.find(r => r.requisitoId === req.id);
                let resultadoTexto = result?.resultado || 'Pendiente';
                if (result && result.adjuntos && result.adjuntos.length > 0) {
                    resultadoTexto += ' (Ver Anexo)';
                }
                tableData.push([req.id, req.requerimientoOperacional, resultadoTexto, result?.comentarios || '']);
            });
        });
    });

    autoTable(doc, { head: [tableColumns], body: tableData, startY: 60, styles: { fontSize: 8 }, headStyles: { fillColor: [52, 142, 68] } });

    const nonConformitiesWithEvidence = audit.resultados.filter(r => r.resultado === 'NC' && r.adjuntos && r.adjuntos.length > 0);
    if (nonConformitiesWithEvidence.length > 0) {
        doc.addPage();
        doc.setFontSize(18);
        doc.text("Anexo: Evidencias de No Conformidades (PS)", 14, 22);
        let currentY = 35;
        for (const nc of nonConformitiesWithEvidence) {
            const reqData = checklist[nc.pilarId]?.estandares[nc.estandarId]?.requisitos.find(r => r.id === nc.requisitoId);
            if (currentY > 250) { doc.addPage(); currentY = 22; }
            doc.setFontSize(12); doc.setFont(undefined, 'bold');
            doc.text(`Requisito: ${nc.requisitoId}`, 14, currentY); currentY += 7;
            doc.setFont(undefined, 'normal'); doc.setFontSize(10);
            const reqTextLines = doc.splitTextToSize(reqData?.requerimientoOperacional || 'Descripción no encontrada.', 180);
            doc.text(reqTextLines, 14, currentY); currentY += (reqTextLines.length * 5);
            doc.setFont(undefined, 'italic');
            const commentLines = doc.splitTextToSize(`Comentario del Auditor: "${nc.comentarios || 'Sin comentarios'}"`, 180);
            doc.text(commentLines, 14, currentY); currentY += (commentLines.length * 5) + 5;
            for (const file of nc.adjuntos) {
                if (file.url.match(/\.(jpeg|jpg|gif|png)$/i)) {
                    try {
                        const imgData = await imageToBase64(file.url);
                        if (currentY + 60 > 280) { doc.addPage(); currentY = 22; }
                        doc.addImage(imgData, 'JPEG', 14, currentY, 80, 60);
                        currentY += 70;
                    } catch (error) {
                        doc.text(`[Error al cargar imagen: ${file.name}]`, 14, currentY);
                        currentY += 7;
                    }
                }
            }
            currentY += 10;
        }
    }
    
    let finalY = (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY : 60;
    
    if (finalY > 180 || nonConformitiesWithEvidence.length > 0) {
        doc.addPage();
        finalY = 20;
    } else {
        finalY += 20;
    }
    
    const totalPuntosAuditados = audit.resultados.length;
    if (totalPuntosAuditados > 0) {
        const conformes = audit.resultados.filter(r => r.resultado === 'C').length;
        const noConformes = audit.resultados.filter(r => r.resultado === 'NC').length;
        const noObservados = audit.resultados.filter(r => r.resultado === 'NO').length;
        const pConformes = ((conformes / totalPuntosAuditados) * 100).toFixed(1);
        const pNoConformes = ((noConformes / totalPuntosAuditados) * 100).toFixed(1);
        const pNoObservados = ((noObservados / totalPuntosAuditados) * 100).toFixed(1);
        doc.setFontSize(14); doc.text("Resumen de Resultados", 14, finalY); finalY += 10;
        doc.setFontSize(11);
        doc.text(`- Conformes (C): ${conformes} (${pConformes}%)`, 14, finalY); finalY += 7;
        doc.text(`- No Conformes (NC): ${noConformes} (${pNoConformes}%)`, 14, finalY); finalY += 7;
        doc.text(`- No Observados (NO): ${noObservados} (${pNoObservados}%)`, 14, finalY); finalY += 7;
        doc.setFontSize(12); doc.text(`Total de Puntos Auditados: ${totalPuntosAuditados}`, 14, finalY);
    }
    
    finalY += 40;
    doc.line(20, finalY, 80, finalY);
    doc.text("Firma Auditor/es", 35, finalY + 5);
    doc.line(120, finalY, 180, finalY);
    doc.text("Firma Responsable Sucursal", 125, finalY + 5);

    doc.save(`Auditoria_PS_${audit.numeroAuditoria}.pdf`);
};

export const exportToXLS = (audit, checklist) => {
    if (!audit) {
        alert("Por favor, selecciona una auditoría para exportar.");
        return;
    }
    const worksheetData = [
        ["Auditoría:", audit.numeroAuditoria], ["Lugar:", audit.lugar], ["Auditores:", audit.auditores.join(', ')],
        ["Auditados:", audit.auditados.join(', ')], ["Fecha Inicio:", audit.fechaCreacion.toDate().toLocaleDateString()],
        ["Fecha Cierre:", audit.fechaCierre ? audit.fechaCierre.toDate().toLocaleDateString() : 'Abierta'],
        [], ["Pilar", "Estándar", "Requisito ID", "Descripción", "Resultado", "Comentarios"]
    ];
    PILARES_ORDER.forEach(pilarId => {
        const pilar = checklist[pilarId];
        if (!pilar) return;
        Object.values(pilar.estandares).forEach(estandar => {
            estandar.requisitos.forEach(req => {
                const result = audit.resultados.find(r => r.requisitoId === req.id);
                worksheetData.push([
                    `${pilar.nombre} (${pilar.id})`, `${estandar.descripcion} (${estandar.id})`,
                    req.id, req.requerimientoOperacional,
                    result?.resultado || 'Pendiente', result?.comentarios || ''
                ]);
            });
        });
    });
    const workbook = utils.book_new();
    const worksheet = utils.aoa_to_sheet(worksheetData);
    utils.book_append_sheet(workbook, worksheet, "Auditoría");
    writeFile(workbook, `Auditoria_PS_${audit.numeroAuditoria}.xlsx`);
};

// --- FUNCIÓN PARA AUDITORÍAS 5S ---
export const exportToPDF5S = async (audit, checklist5S, logoBase64) => {
    if (!audit) {
        alert("Por favor, selecciona una auditoría 5S para exportar.");
        return;
    }

    const doc = new jsPDF();
    if(logoBase64) {
        doc.addImage(logoBase64, 'PNG', 150, 8, 45, 15);
    }
    doc.setFontSize(18);
    doc.text(`Auditoría 5S: ${audit.numeroAuditoria}`, 14, 22);
    doc.setFontSize(11);
    doc.text(`Lugar: ${audit.lugar}`, 14, 30);
    doc.text(`Auditor: ${audit.auditor}`, 14, 36);
    doc.text(`Fecha: ${audit.fecha.toDate().toLocaleDateString()}`, 14, 42);

    const tableColumns = ["Ítem", "Descripción", "Resultado", "Comentarios"];
    const tableData = [];
    Object.entries(checklist5S).forEach(([seccion, items]) => {
        tableData.push([{ content: `--- SECCIÓN: ${seccion} ---`, colSpan: 4, styles: { fontStyle: 'bold', fillColor: [220, 220, 220] } }]);
        items.forEach(item => {
            const result = audit.resultados.find(r => r.itemId === item.id);
            let resultadoTexto = result?.resultado || 'Pendiente';
            if (result && result.adjuntos && result.adjuntos.length > 0) {
                resultadoTexto += ' (Ver Anexo)';
            }
            tableData.push([item.id, item.text, resultadoTexto, result?.comentarios || '']);
        });
    });

    autoTable(doc, { head: [tableColumns], body: tableData, startY: 50, styles: { fontSize: 8 }, headStyles: { fillColor: [52, 142, 68] } });

    const nonConformitiesWithEvidence5S = audit.resultados.filter(r => r.resultado === 'No Conforme' && r.adjuntos && r.adjuntos.length > 0);
    if (nonConformitiesWithEvidence5S.length > 0) {
        doc.addPage();
        doc.setFontSize(18);
        doc.text("Anexo: Evidencias de No Conformidades (5S)", 14, 22);
        let currentY = 35;
        for (const nc of nonConformitiesWithEvidence5S) {
            if (currentY > 250) { doc.addPage(); currentY = 22; }
            doc.setFontSize(12); doc.setFont(undefined, 'bold');
            doc.text(`Ítem: ${nc.itemId} (${nc.seccion})`, 14, currentY); currentY += 7;
            doc.setFont(undefined, 'normal'); doc.setFontSize(10);
            const itemTextLines = doc.splitTextToSize(nc.itemTexto, 180);
            doc.text(itemTextLines, 14, currentY); currentY += (itemTextLines.length * 5);
            doc.setFont(undefined, 'italic');
            const commentLines = doc.splitTextToSize(`Comentario: "${nc.comentarios || 'Sin comentarios'}"`, 180);
            doc.text(commentLines, 14, currentY); currentY += (commentLines.length * 5) + 5;
            for (const file of nc.adjuntos) {
                if (file.url && file.url.match(/\.(jpeg|jpg|gif|png)$/i)) {
                    try {
                        const imgData = await imageToBase64(file.url);
                        if (currentY + 60 > 280) { doc.addPage(); currentY = 22; }
                        doc.addImage(imgData, 'JPEG', 14, currentY, 80, 60);
                        currentY += 70;
                    } catch (error) {
                        doc.text(`[Error al cargar imagen: ${file.name}]`, 14, currentY);
                        currentY += 7;
                    }
                }
            }
            currentY += 10;
        }
    }

    let finalY_5S = (doc.lastAutoTable && doc.lastAutoTable.finalY) || 50;

    if (finalY_5S > 180 || nonConformitiesWithEvidence5S.length > 0) {
        doc.addPage();
        finalY_5S = 20;
    } else {
        finalY_5S += 20;
    }

    const auditados = audit.resultados.filter(r => r.resultado === 'Conforme' || r.resultado === 'No Conforme');
    if (auditados.length > 0) {
        const conformes = auditados.filter(r => r.resultado === 'Conforme').length;
        const noConformes = auditados.length - conformes;
        const porcentaje = ((conformes / auditados.length) * 100).toFixed(1);

        doc.setFontSize(14);
        doc.text("Resumen de Resultados 5S", 14, finalY_5S);
        finalY_5S += 10;
        
        doc.setFontSize(12);
        doc.text(`Porcentaje de Conformidad: ${porcentaje}%`, 14, finalY_5S);
        finalY_5S += 10;
        
        doc.setFontSize(11);
        doc.text(`- Puntos Auditados: ${auditados.length}`, 14, finalY_5S);
        finalY_5S += 7;
        doc.text(`- Conformes: ${conformes}`, 14, finalY_5S);
        finalY_5S += 7;
        doc.text(`- No Conformes: ${noConformes}`, 14, finalY_5S);
    }
    
    finalY_5S += 40;
    doc.line(20, finalY_5S, 80, finalY_5S);
    doc.text("Firma Auditor", 35, finalY_5S + 5);
    doc.line(120, finalY_5S, 180, finalY_5S);
    doc.text("Firma Responsable Sucursal", 125, finalY_5S + 5);

    doc.save(`Auditoria_5S_${audit.numeroAuditoria}.pdf`);
};