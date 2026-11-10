// src/utils/exportUtils.js

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { utils, writeFile } from 'xlsx';
import { PILARES_ORDER } from './ordering.js';
import { firebaseServices } from '../firebase/services.js';

// Helper seguro para formateo de fechas de Firestore o cadenas
export const formatDate = (val) => {
    if (!val) return 'N/A';
    if (typeof val.toDate === 'function') {
        try {
            return val.toDate().toLocaleDateString();
        } catch (e) {
            console.warn("Error en val.toDate():", e);
        }
    }
    try {
        const d = new Date(val);
        return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString();
    } catch (e) {
        return 'N/A';
    }
};

// Función auxiliar para convertir imágenes de URL a Base64 de forma ultra robusta
const imageToBase64 = async (url) => {
    if (!url) return null;

    const blobToDataURL = (blob) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });

    const fetchWithTimeout = async (targetUrl, timeoutMs = 4000) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const res = await fetch(targetUrl, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const blob = await res.blob();
            return await blobToDataURL(blob);
        } catch (err) {
            clearTimeout(timeoutId);
            throw err;
        }
    };

    // 1. Intento directo (útil para Firebase Storage y URLs con CORS)
    try {
        const data = await fetchWithTimeout(url, 4000);
        if (data) return data;
    } catch (e) {
        // Fallback a proxies si el intento directo falla
    }

    // 2. Proxies con timeout
    const proxies = [
        (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
        (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`
    ];

    for (const proxy of proxies) {
        try {
            const proxyUrl = proxy(url);
            const data = await fetchWithTimeout(proxyUrl, 4000);
            if (data) return data;
        } catch (error) {
            // Intenta el siguiente proxy
        }
    }

    return null;
};

// --- FUNCIÓN PARA AUDITORÍAS PS (POWER SERVICE) ---
export const exportToPDF = async (audit, checklist, logoBase64) => {
    if (!audit) {
        alert("Por favor, selecciona una auditoría para exportar.");
        return;
    }

    const doc = new jsPDF();
    if (logoBase64) {
        try {
            doc.addImage(logoBase64, 'PNG', 150, 8, 45, 15);
        } catch (e) { 
            console.warn("No se pudo añadir logo al PDF:", e); 
        }
    }
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(`Auditoría Power Service: ${audit.numeroAuditoria || 'S/N'}`, 14, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Lugar / Sucursal: ${audit.lugar || 'N/A'}`, 14, 28);
    doc.text(`Auditores: ${audit.auditores ? audit.auditores.join(', ') : 'N/A'}`, 14, 34);
    doc.text(`Auditados: ${audit.auditados ? audit.auditados.join(', ') : 'N/A'}`, 14, 40);
    doc.text(`Fecha Inicio: ${formatDate(audit.fechaCreacion)}`, 14, 46);
    doc.text(`Fecha Cierre: ${audit.fechaCierre ? formatDate(audit.fechaCierre) : (audit.estado === 'cerrada' ? 'Cerrada' : 'Abierta')}`, 14, 52);

    const tableColumns = ["Requisito", "Descripción", "Resultado", "Comentarios"];
    const tableData = [];
    const resultados = audit.resultados || [];

    PILARES_ORDER.forEach(pilarId => {
        const pilar = checklist ? checklist[pilarId] : null;
        if (!pilar) return;
        tableData.push([{ content: `--- PILAR: ${pilar.nombre} (${pilar.id}) ---`, colSpan: 4, styles: { fontStyle: 'bold', fillColor: [220, 220, 220] } }]);
        if (pilar.estandares) {
            Object.values(pilar.estandares).forEach(estandar => {
                tableData.push([{ content: `Estándar: ${estandar.descripcion} (${estandar.id})`, colSpan: 4, styles: { fontStyle: 'italic', fillColor: [240, 240, 240] } }]);
                if (estandar.requisitos) {
                    estandar.requisitos.forEach(req => {
                        const result = resultados.find(r => r.requisitoId === req.id);
                        let resultadoTexto = result?.resultado || 'Pendiente';
                        if (result && result.adjuntos && result.adjuntos.length > 0) {
                            resultadoTexto += ' (Con Evidencia)';
                        }
                        tableData.push([req.id, req.requerimientoOperacional || '', resultadoTexto, result?.comentarios || '']);
                    });
                }
            });
        }
    });

    autoTable(doc, { 
        head: [tableColumns], 
        body: tableData, 
        startY: 58, 
        styles: { fontSize: 8, overflow: 'linebreak' }, 
        headStyles: { fillColor: [52, 142, 68] },
        columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 90 },
            2: { cellWidth: 30 },
            3: { cellWidth: 45 }
        }
    });

    const nonConformitiesWithEvidence = resultados.filter(r => (r.resultado === 'NC' || r.resultado === 'No Conforme') && r.adjuntos && r.adjuntos.length > 0);
    
    if (nonConformitiesWithEvidence.length > 0) {
        doc.addPage();
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text("Anexo: Evidencias de No Conformidades", 14, 20);
        let currentY = 30;
        
        for (const nc of nonConformitiesWithEvidence) {
            const reqData = checklist && checklist[nc.pilarId]?.estandares?.[nc.estandarId]?.requisitos?.find(r => r.id === nc.requisitoId);
            
            if (currentY > 230) { 
                doc.addPage(); 
                currentY = 20; 
            }
            
            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            doc.text(`Requisito: ${nc.requisitoId}`, 14, currentY); 
            currentY += 6;
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            const reqTextLines = doc.splitTextToSize(reqData?.requerimientoOperacional || 'Descripción de requisito.', 180);
            doc.text(reqTextLines, 14, currentY); 
            currentY += (reqTextLines.length * 4.5);
            
            if (nc.comentarios) {
                doc.setFont("helvetica", "italic");
                const commentLines = doc.splitTextToSize(`Comentario: "${nc.comentarios}"`, 180);
                doc.text(commentLines, 14, currentY); 
                currentY += (commentLines.length * 4.5) + 3;
            }
            
            if (nc.adjuntos) {
                for (const file of nc.adjuntos) {
                    if (file.url && (file.url.toLowerCase().includes('alt=media') || file.url.match(/\.(jpeg|jpg|gif|png|webp)/i))) {
                        try {
                            const imgData = await imageToBase64(file.url);
                            if (imgData) {
                                if (currentY + 65 > 280) { 
                                    doc.addPage(); 
                                    currentY = 20; 
                                }
                                doc.addImage(imgData, 'JPEG', 14, currentY, 80, 55);
                                currentY += 60;
                            } else {
                                doc.setFont("helvetica", "italic");
                                doc.setFontSize(8);
                                doc.text(`[Evidencia adjunta: ${file.name || 'Imagen'}]`, 14, currentY);
                                currentY += 6;
                            }
                        } catch (error) {
                            doc.setFont("helvetica", "italic");
                            doc.setFontSize(8);
                            doc.text(`[Evidencia: ${file.name || 'Archivo'}]`, 14, currentY);
                            currentY += 6;
                        }
                    }
                }
            }
            currentY += 8;
        }
    }
    
    let finalY = (doc.lastAutoTable && doc.lastAutoTable.finalY) || 60;
    if (finalY > 210) {
        doc.addPage();
        finalY = 25;
    } else {
        finalY += 15;
    }
    
    const totalPuntosAuditados = resultados.length;
    if (totalPuntosAuditados > 0) {
        const conformes = resultados.filter(r => r.resultado === 'C' || r.resultado === 'Conforme').length;
        const noConformes = resultados.filter(r => r.resultado === 'NC' || r.resultado === 'No Conforme').length;
        const noObservados = resultados.filter(r => r.resultado === 'NO' || r.resultado === 'No Observado').length;
        const ncCerradas = resultados.filter(r => r.resultado === 'NC Cerrada').length;

        const pConformes = ((conformes / totalPuntosAuditados) * 100).toFixed(1);
        const pNoConformes = ((noConformes / totalPuntosAuditados) * 100).toFixed(1);
        const pNoObservados = ((noObservados / totalPuntosAuditados) * 100).toFixed(1);
        const pNcCerradas = ((ncCerradas / totalPuntosAuditados) * 100).toFixed(1);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(13); 
        doc.text("Resumen de Resultados", 14, finalY); 
        finalY += 8;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`- Conformes (C): ${conformes} (${pConformes}%)`, 14, finalY); finalY += 6;
        doc.text(`- No Conformes (NC): ${noConformes} (${pNoConformes}%)`, 14, finalY); finalY += 6;
        doc.text(`- No Observados (NO): ${noObservados} (${pNoObservados}%)`, 14, finalY); finalY += 6;
        doc.text(`- NC Cerradas: ${ncCerradas} (${pNcCerradas}%)`, 14, finalY); finalY += 6;
        doc.setFont("helvetica", "bold");
        doc.text(`Total de Puntos Auditados: ${totalPuntosAuditados}`, 14, finalY);
    }
    
    finalY += 35;
    if (finalY > 260) {
        doc.addPage();
        finalY = 40;
    }
    doc.line(20, finalY, 80, finalY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Firma Auditor/es", 35, finalY + 5);
    doc.line(120, finalY, 180, finalY);
    doc.text("Firma Responsable Sucursal", 125, finalY + 5);

    // Numeración de páginas
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${pageCount} - Sartor Power Service`, 105, 290, { align: 'center' });
    }

    doc.save(`Auditoria_PS_${audit.numeroAuditoria || 'export'}.pdf`);
};

export const exportToXLS = (audit, checklist) => {
    if (!audit) {
        alert("Por favor, selecciona una auditoría para exportar.");
        return;
    }
    const worksheetData = [
        ["Auditoría Power Service:", audit.numeroAuditoria || ''], 
        ["Lugar / Sucursal:", audit.lugar || ''], 
        ["Auditores:", audit.auditores ? audit.auditores.join(', ') : ''],
        ["Auditados:", audit.auditados ? audit.auditados.join(', ') : ''], 
        ["Fecha Inicio:", formatDate(audit.fechaCreacion)],
        ["Fecha Cierre:", audit.fechaCierre ? formatDate(audit.fechaCierre) : 'Abierta'],
        [], 
        ["Pilar", "Estándar", "Requisito ID", "Descripción", "Resultado", "Comentarios"]
    ];

    const resultados = audit.resultados || [];
    PILARES_ORDER.forEach(pilarId => {
        const pilar = checklist ? checklist[pilarId] : null;
        if (!pilar || !pilar.estandares) return;
        Object.values(pilar.estandares).forEach(estandar => {
            if (!estandar.requisitos) return;
            estandar.requisitos.forEach(req => {
                const result = resultados.find(r => r.requisitoId === req.id);
                worksheetData.push([
                    `${pilar.nombre} (${pilar.id})`, 
                    `${estandar.descripcion} (${estandar.id})`,
                    req.id, 
                    req.requerimientoOperacional,
                    result?.resultado || 'Pendiente', 
                    result?.comentarios || ''
                ]);
            });
        });
    });

    const workbook = utils.book_new();
    const worksheet = utils.aoa_to_sheet(worksheetData);
    utils.book_append_sheet(workbook, worksheet, "Auditoría PS");
    writeFile(workbook, `Auditoria_PS_${audit.numeroAuditoria || 'export'}.xlsx`);
};

// --- FUNCIÓN PARA AUDITORÍAS 5S (SERVICIO Y REPUESTOS) ---
export const exportToPDF5S = async (audit, customChecklist, logoBase64) => {
    if (!audit) {
        alert("Por favor, selecciona una auditoría 5S para exportar.");
        return;
    }

    const isRepuestos = audit.tipo5S === 'repuestos' || (audit.numeroAuditoria && audit.numeroAuditoria.startsWith('5SR'));
    const tipoTitulo = isRepuestos ? "5S Repuestos" : "5S Servicio";

    // Si no se pasó checklist, obtener el adecuado
    const checklist5S = customChecklist || (isRepuestos 
        ? firebaseServices.get5SRepuestosChecklist(audit.lugar) 
        : firebaseServices.get5SChecklist());

    const doc = new jsPDF();
    if (logoBase64) {
        try { 
            doc.addImage(logoBase64, 'PNG', 150, 8, 45, 15); 
        } catch(e) {
            console.warn("No se pudo añadir logo 5S:", e);
        }
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(`Auditoría ${tipoTitulo}: ${audit.numeroAuditoria || 'S/N'}`, 14, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Lugar / Sucursal: ${audit.lugar || 'N/A'}`, 14, 28);
    doc.text(`Auditor: ${audit.auditor || 'N/A'}`, 14, 34);
    doc.text(`Fecha: ${formatDate(audit.fecha || audit.creadoEn)}`, 14, 40);
    doc.text(`Estado: ${audit.estado === 'finalizada' ? 'Finalizada' : 'En Progreso'}`, 14, 46);

    const tableColumns = ["Ítem", "Descripción", "Resultado", "Comentarios"];
    const tableData = [];
    const resultados = audit.resultados || [];

    Object.entries(checklist5S).forEach(([seccion, items]) => {
        tableData.push([{ content: `--- SECCIÓN: ${seccion} ---`, colSpan: 4, styles: { fontStyle: 'bold', fillColor: [220, 220, 220] } }]);
        items.forEach(item => {
            const result = resultados.find(r => String(r.itemId) === String(item.id));
            let resultadoTexto = result?.resultado || 'Pendiente';
            if (result && result.adjuntos && result.adjuntos.length > 0) {
                resultadoTexto += ' (Con Evidencia)';
            }
            tableData.push([item.id, item.text, resultadoTexto, result?.comentarios || '']);
        });
    });

    autoTable(doc, { 
        head: [tableColumns], 
        body: tableData, 
        startY: 52, 
        styles: { fontSize: 8, overflow: 'linebreak' }, 
        headStyles: { fillColor: isRepuestos ? [220, 100, 30] : [52, 142, 68] },
        columnStyles: {
            0: { cellWidth: 15 },
            1: { cellWidth: 100 },
            2: { cellWidth: 35 },
            3: { cellWidth: 40 }
        }
    });

    const nonConformitiesWithEvidence5S = resultados.filter(r => (r.resultado === 'No Conforme' || r.resultado === 'NC') && r.adjuntos && r.adjuntos.length > 0);
    
    if (nonConformitiesWithEvidence5S.length > 0) {
        doc.addPage();
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text(`Anexo: Evidencias de No Conformidades (${tipoTitulo})`, 14, 20);
        let currentY = 30;

        for (const nc of nonConformitiesWithEvidence5S) {
            if (currentY > 230) { 
                doc.addPage(); 
                currentY = 20; 
            }
            
            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            doc.text(`Ítem: ${nc.itemId} (${nc.seccion || 'General'})`, 14, currentY); 
            currentY += 6;
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            const itemTextLines = doc.splitTextToSize(nc.itemTexto || 'Descripción del ítem', 180);
            doc.text(itemTextLines, 14, currentY); 
            currentY += (itemTextLines.length * 4.5);
            
            if (nc.comentarios) {
                doc.setFont("helvetica", "italic");
                const commentLines = doc.splitTextToSize(`Comentario: "${nc.comentarios}"`, 180);
                doc.text(commentLines, 14, currentY); 
                currentY += (commentLines.length * 4.5) + 3;
            }
            
            if (nc.adjuntos) {
                for (const file of nc.adjuntos) {
                    if (file.url && (file.url.toLowerCase().includes('alt=media') || file.url.match(/\.(jpeg|jpg|gif|png|webp)/i))) {
                        try {
                            const imgData = await imageToBase64(file.url);
                            if (imgData) {
                                if (currentY + 65 > 280) { 
                                    doc.addPage(); 
                                    currentY = 20; 
                                }
                                doc.addImage(imgData, 'JPEG', 14, currentY, 80, 55);
                                currentY += 60;
                            } else {
                                doc.setFont("helvetica", "italic");
                                doc.setFontSize(8);
                                doc.text(`[Evidencia adjunta: ${file.name || 'Foto'}]`, 14, currentY);
                                currentY += 6;
                            }
                        } catch (error) {
                            doc.setFont("helvetica", "italic");
                            doc.setFontSize(8);
                            doc.text(`[Evidencia: ${file.name || 'Archivo'}]`, 14, currentY);
                            currentY += 6;
                        }
                    }
                }
            }
            currentY += 8;
        }
    }

    let finalY_5S = (doc.lastAutoTable && doc.lastAutoTable.finalY) || 52;
    if (finalY_5S > 210) {
        doc.addPage();
        finalY_5S = 25;
    } else {
        finalY_5S += 15;
    }

    const auditados = resultados.filter(r => r.resultado === 'Conforme' || r.resultado === 'No Conforme' || r.resultado === 'NC Cerrada');
    if (auditados.length > 0) {
        const conformes = auditados.filter(r => r.resultado === 'Conforme').length;
        const noConformes = auditados.filter(r => r.resultado === 'No Conforme').length;
        const ncCerradas = auditados.filter(r => r.resultado === 'NC Cerrada').length;
        
        const porcentaje = ((conformes + ncCerradas) / auditados.length * 100).toFixed(1);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(13); 
        doc.text(`Resumen de Resultados ${tipoTitulo}`, 14, finalY_5S); 
        finalY_5S += 8;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(`Porcentaje de Conformidad: ${porcentaje}%`, 14, finalY_5S); 
        finalY_5S += 7;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`- Puntos Auditados: ${auditados.length}`, 14, finalY_5S); finalY_5S += 6;
        doc.text(`- Conformes: ${conformes}`, 14, finalY_5S); finalY_5S += 6;
        doc.text(`- No Conformes: ${noConformes}`, 14, finalY_5S); finalY_5S += 6;
        doc.text(`- NC Cerradas: ${ncCerradas}`, 14, finalY_5S);
    }
    
    finalY_5S += 35;
    if (finalY_5S > 260) {
        doc.addPage();
        finalY_5S = 40;
    }
    doc.line(20, finalY_5S, 80, finalY_5S);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Firma Auditor", 35, finalY_5S + 5);
    doc.line(120, finalY_5S, 180, finalY_5S);
    doc.text("Firma Responsable Sucursal", 125, finalY_5S + 5);

    // Numeración de páginas
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${pageCount} - Sartor ${tipoTitulo}`, 105, 290, { align: 'center' });
    }

    doc.save(`Auditoria_5S_${isRepuestos ? 'Repuestos_' : ''}${audit.numeroAuditoria || 'export'}.pdf`);
};

export const exportToXLS5S = (audit, customChecklist) => {
    if (!audit) {
        alert("Por favor, selecciona una auditoría 5S para exportar.");
        return;
    }
    const isRepuestos = audit.tipo5S === 'repuestos' || (audit.numeroAuditoria && audit.numeroAuditoria.startsWith('5SR'));
    const tipoTitulo = isRepuestos ? "5S Repuestos" : "5S Servicio";
    const checklist5S = customChecklist || (isRepuestos 
        ? firebaseServices.get5SRepuestosChecklist(audit.lugar) 
        : firebaseServices.get5SChecklist());

    const worksheetData = [
        [`Auditoría ${tipoTitulo}:`, audit.numeroAuditoria || ''],
        ["Lugar / Sucursal:", audit.lugar || ''],
        ["Auditor:", audit.auditor || ''],
        ["Fecha:", formatDate(audit.fecha || audit.creadoEn)],
        ["Estado:", audit.estado === 'finalizada' ? 'Finalizada' : 'En Progreso'],
        [],
        ["Sección", "Ítem ID", "Descripción", "Resultado", "Comentarios"]
    ];

    const resultados = audit.resultados || [];
    Object.entries(checklist5S).forEach(([seccion, items]) => {
        items.forEach(item => {
            const result = resultados.find(r => String(r.itemId) === String(item.id));
            worksheetData.push([
                seccion,
                item.id,
                item.text,
                result?.resultado || 'Pendiente',
                result?.comentarios || ''
            ]);
        });
    });

    const workbook = utils.book_new();
    const worksheet = utils.aoa_to_sheet(worksheetData);
    utils.book_append_sheet(workbook, worksheet, `Auditoría ${tipoTitulo}`);
    writeFile(workbook, `Auditoria_5S_${isRepuestos ? 'Repuestos_' : ''}${audit.numeroAuditoria || 'export'}.xlsx`);
};
