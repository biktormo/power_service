// src/components/SeedDatabaseButton.jsx
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const SeedDatabaseButton = () => {
    const [loading, setLoading] = useState(false);

    const seedDatabase = async () => {
        if (!window.confirm("¿Estás seguro? Esto borrará y recargará toda la checklist. Úsalo solo si es necesario.")) return;

        setLoading(true);
        toast.loading("Poblando la base de datos... Esto puede tardar.");
        
        const checklistData = {
          "IS": {
            "id": "IS",
            "nombre": "Infraestructura y Seguridad",
            "estandares": {
              "IS.1": {
                "id": "IS.1",
                "descripcion": "Identificación y Señalización",
                "requisitos": {
                  "IS.1.1": {
                    "id": "IS.1.1",
                    "pilarId": "IS",
                    "estandarId": "IS.1",
                    "requerimientoOperacional": "Las identificaciones externas del Concesionario deben estar de acuerdo con el Manual MIV, siendo que: las fachadas, tótem y letreros direccionales deben:\r\na) Permanecer en perfecto estado, limpio y con el sistema de iluminación en perfecto estado de funcionamiento (sin letras faltantes, lámparas peladas, manchadas o quemadas);\r\nb) Ser fácilmente visible por los Clientes en la vía pública.",
                    "comoEvaluar": "a) Compruebe que las señales estén en perfecto estado y sean legibles. Tótem y fachadas, así como otros elementos de señalización, cuando estén iluminados, deberán tener todas las lámparas en funcionamiento. \nb) Compruebe desde la vía pública que los elementos de identificación externos sean fácilmente visibles, es decir, que no existan elementos que impidan la lectura, como árboles, pancartas, letreros, etc. En los casos en que exista legislación vigente que establezca los criterios para señales y tótems, se deberá respetar esta."
                  },
                  "IS.1.2": {
                    "id": "IS.1.2",
                    "pilarId": "IS",
                    "estandarId": "IS.1",
                    "requerimientoOperacional": "Los avisos que contengan el horario de atención y los teléfonos de la llamada de Postventa (Gerente de Servicio y Departamento de Repuestos) deberán instalarse en la puerta principal de la sala de exhibición y en las puertas de entrada principal del Concesionario, de acuerdo a los criterios del Capítulo MIV. 3 - Identificación interna, G13.1 y G13.2.",
                    "comoEvaluar": "Verificar la existencia de avisos en la puerta principal del showroom y en las principales puertas de acceso al Concesionario, y si están en conformidad con el MIV."
                  },
                  "IS.1.3": {
                    "id": "IS.1.3",
                    "pilarId": "IS",
                    "estandarId": "IS.1",
                    "requerimientoOperacional": "Las plazas de aparcamiento exclusivas para Clientes deben estar en buen estado físico, marcadas y señalizadas.",
                    "comoEvaluar": "Verificar que las plazas de aparcamiento para Clientes estén en buen estado y debidamente marcadas y señalizadas."
                  },
                  "IS.1.4": {
                    "id": "IS.1.4",
                    "pilarId": "IS",
                    "estandarId": "IS.1",
                    "requerimientoOperacional": "La identificación externa del Concesionario: señales, letreros, pancartas, letreros de puertas, equipos de prevención de incendios y marcas de piso deben estar en perfecto estado y visibles para todos.",
                    "comoEvaluar": "Compruebe que los señales en las puertas, los equipos de prevención de incendios, las tiras de seguridad en las puertas de vidrio estén en buenas condiciones y sean visibles para todos."
                  }
                }
              },
              "IS.2": {
                "id": "IS.2",
                "descripcion": "Identificación de los Empleados",
                "requisitos": {
                  "IS.2.1": {
                    "id": "IS.2.1",
                    "pilarId": "IS",
                    "estandarId": "IS.2",
                    "requerimientoOperacional": "Todos los empleados deben estar debidamente uniformados, de acuerdo con sus funciones, de acuerdo al Capítulo 8 del MIV - Uniformes:\r\na) Los empleados de las áreas administrativas, así como los Técnicos, deberán estar debidamente uniformados de acuerdo con la norma MIV;\r\nb) La cantidad de uniformes entregados a los Técnicos debe ser suficiente para proporcionar su lavado, considerando las condiciones laborales a las que se encuentran sometidos;\r\nc) Los uniformes descoloridos o rotos deben reemplazarse.\r\nd) El Concesionario deberá contar con una Política de Suministro Uniforme formalizada y validada, que incluya el número de uniformes a entregar a la llegada del Empleado al Concesionario y la frecuencia de los intercambios.",
                    "comoEvaluar": "a) Compruebe in loco si los uniformes del Equipo están en buen estado de conservación y si cumplen con los requisitos del MIV Capítulo 8 - Uniformes.\nb) Compruebe in loco el estado general de limpieza y mantenimiento de los uniformes.\nc) Compruebe in loco el estado general de conservación de los uniformes.\nd) Compruebe la existencia de una Política de Suministro de Uniformes, considerando las reglas para su uso y reemplazo. Seleccione 3 técnicos cuyos uniformes estén en las peores condiciones y compruebe que el período de sustitución no ha expirado."
                  }
                }
              },
              "IS.3": {
                "id": "IS.3",
                "descripcion": "Equipos y Sistema de\r\nDiagnóstico",
                "requisitos": {
                  "IS.3.1": {
                    "id": "IS.3.1",
                    "pilarId": "IS",
                    "estandarId": "IS.3",
                    "requerimientoOperacional": "Todos los técnicos involucrados directamente en la prestación de servicios deben tener computadoras y / o portátiles con acceso a los portales de John Deere (Service Advisor, Parts Advisor, DTAC y Service Admin.).",
                    "comoEvaluar": "Verificar en al menos 3 computadoras y / o laptops la disponibilidad y acceso por parte del técnico a todos los Portales recomendados, según requerimiento operativo."
                  },
                  "IS.3.2": {
                    "id": "IS.3.2",
                    "pilarId": "IS",
                    "estandarId": "IS.3",
                    "requerimientoOperacional": "La cantidad de computadoras y / o laptops disponibles para los técnicos debe cumplir con los requisitos de hardware y software recomendados por John Deere, para poder \"ejecutar\" las últimas versiones de Service Advisor y Parts Advisor.",
                    "comoEvaluar": "Compruebe las configuraciones descritas en la declaración \"Service Advisor Hardware Update\" 5.2 y \"Parts Advisor\": requisitos del sistema en las computadoras de 3 técnicos distintos.}"
                  },
                  "IS.3.3": {
                    "id": "IS.3.3",
                    "pilarId": "IS",
                    "estandarId": "IS.3",
                    "requerimientoOperacional": "El Concesionario debe tener kits de EDL de acuerdo con la tabla de niveles de uso de Service ADVISOR ™, recomendada por John Deere.",
                    "comoEvaluar": "Compruebe en la lista de verificación y físicamente si las cantidades de kit EDL existentes en el Concesionario cumplen con lo recomendado, según la tabla de niveles de uso del Asesor de Servicio, archivo \"Nivel de Uso del Service Advisor\".\r\nLas excepciones deben ser aprobadas por el TCSM."
                  },
                  "IS.3.4": {
                    "id": "IS.3.4",
                    "pilarId": "IS",
                    "estandarId": "IS.3",
                    "requerimientoOperacional": "El Concesionario deberá contar con kits de análisis de fluidos para realizar diagnósticos en los servicios de mantenimiento preventivo, siguiendo la misma cantidad especificada para los kits EDL / Computadoras, contenidos en el archivo “Nivel de Uso del Service Advisor”.",
                    "comoEvaluar": "Compruebe en la lista de control y físicamente si las cantidades de kits de Análisis de Fluidos en el Concesionario cumplen con lo recomendado, de acuerdo con la tabla de niveles de uso de Service Advisor, archivo \"Nivel de Uso del Service Advisor\".\r\nLas excepciones deben ser aprobadas por el TCSM."
                  },
                  "IS.3.5": {
                    "id": "IS.3.5",
                    "pilarId": "IS",
                    "estandarId": "IS.3",
                    "requerimientoOperacional": "El Concesionario deberá mantener un control formal de las computadoras, notebooks, kits, tabletas, smartphones y demás equipos puestos a disposición de los Técnicos, necesarios para la realización de los Diagnósticos de Mantenimiento.",
                    "comoEvaluar": "Verificar la existencia y efectividad del control de equipos para Técnicos."
                  }
                }
              },
              "IS.4": {
                "id": "IS.4",
                "descripcion": "Herramientas",
                "requisitos": {
                  "IS.4.1": {
                    "id": "IS.4.1",
                    "pilarId": "IS",
                    "estandarId": "IS.4",
                    "requerimientoOperacional": "Herramientas básicas:\r\na) El Concesionario deberá contar con una LISTA DE HERRAMIENTAS BÁSICAS para realizar los servicios y ponerlas a disposición de los Técnicos, especificándolas, artículo por artículo;\r\nb) El Concesionario debe tener definida una POLÍTICA DE REEMPLAZO DE HERRAMIENTAS, en caso de pérdida, desgaste o mal uso;\r\nc) LA LISTA DE HERRAMIENTAS BÁSICAS y LA POLÍTICA DE REEMPLAZO DE HERRAMIENTAS debe ser firmada por el Técnico, asegurando la confirmación de recepción y responsabilidad por su integridad;\r\nd) Se debe designar un profesional como responsable del control del utillaje y auditar periódicamente (con un intervalo máximo de 6 meses) la caja de herramientas de cada Técnico. Las herramientas faltantes o defectuosas deben ser reemplazadas, según lo establecido en la POLÍTICA DE REEMPLAZO DE HERRAMIENTAS.",
                    "comoEvaluar": "a) Verificar la existencia de la LISTA DE HERRAMIENTAS BÁSICAS que contiene todas las herramientas básicas definidas y puestas a disposición de los Técnicos. LA LISTA DE HERRAMIENTAS BÁSICAS puede variar por Distribuidor o taller, incluso por Técnico, según el parque de maquinaria predominante en la región y la calificación del empleado.\nb) Verificar la existencia de una POLÍTICA DE REEMPLAZO DE HERRAMIENTAS.\nc) Verificar que la LISTA DE HERRAMIENTAS BÁSICAS y la POLÍTICA DE REEMPLAZO DE HERRAMIENTAS estén firmadas por todos los Técnicos y, conjuntamente, por el responsable de control de herramientas básicas.\nd) Verificar el procedimiento de control y la periodicidad de la auditoría de las cajas de herramientas y la evidencia de la fecha de la última auditoría de la caja de herramientas."
                  },
                  "IS.4.2": {
                    "id": "IS.4.2",
                    "pilarId": "IS",
                    "estandarId": "IS.4",
                    "requerimientoOperacional": "Herramientas especiales:\r\na) El Concesionario debe tener las Herramientas  incluyendo aquellas que son personalizadas y / o fabricadas en la propia Concesionaria. Especiales en cantidad y surtido adecuados (según lo dispuesto en la NMQ), para que los Técnicos puedan realizar los Servicios con la calidad y precisión requeridas por John Deere;\r\nb) Verificar si las Herramientas Especiales se encuentran almacenadas en un lugar específico, catalogadas, organizadas y etiquetadas con el código y figura, y con control de acceso y retiro,\r\nb) Las Herramientas Especiales deberán estar catalogadas, organizadas e identificadas con el código, figura y descripción, incluyendo aquellas que sean personalizadas y / o fabricadas en la propio Concesionario;\r\nc) El Concesionario deberá controlar el stock e inventario de las Herramientas Especiales;\r\nd) Herramientas especiales y equipos de medición, tales como: multímetros, llaves dinamométricas, micrómetros, manómetros, deben tener un sello con fecha de vencimiento para la recalibración actual, de acuerdo con la recomendación del fabricante. ",
                    "comoEvaluar": "a) Solicite al Gerente de Servicio que ingrese a la página NMQ, link jdnmq.deere.com y acceda a \"Verificación de estado de calificaciones\". Verifique la confirmación de estado de NMQ Tooling - New Model Qualification.\nb) Verificar si las Herramientas Especiales se encuentran almacenadas en un lugar específico, catalogadas, organizadas y etiquetadas con el código y figura, y con control de acceso y retiro, incluyendo aquellas que son personalizadas y / o fabricadas en el propio Concesionario.\nc) Elegir aleatoriamente 3 Herramientas Especiales, buscarlas en el almacén. Verificar su existencia física y correcta ubicación  de acuerdo al control de ubicación del Distribuidor\nd) Verifique las fechas de caducidad de las Herramientas Especiales y equipos de medición cuyos fabricantes recomiendan recalibraciones periódicas. Compruebe si las recalibraciones las realiza un organismo autorizado."
                  }
                }
              },
              "IS.5": {
                "id": "IS.5",
                "descripcion": "Vehículos",
                "requisitos": {
                  "IS.5.1": {
                    "id": "IS.5.1",
                    "pilarId": "IS",
                    "estandarId": "IS.5",
                    "requerimientoOperacional": "Los vehículos a disposición de los Técnicos deben adecuarse a las necesidades de los rigores de la prestación de servicios en campo, considerando el almacenamiento de herramientas, repuestos y otros equipos, según el MIV;",
                    "comoEvaluar": "Verifique la compatibilidad de los vehículos con los rigores de acceso a las propiedades de los Clientes y su capacidad de almacenamiento de herramientas, repuestos y otros equipos."
                  },
                  "IS.5.2": {
                    "id": "IS.5.2",
                    "pilarId": "IS",
                    "estandarId": "IS.5",
                    "requerimientoOperacional": "La identificación del vehículo debe estar en perfectas condiciones y de acuerdo con el Capítulo 6 del Manual MIV - Identificación del vehículo.",
                    "comoEvaluar": "Verificar que la identificación del vehículo esté en perfecto estado y de acuerdo con el Capítulo 6 del Manual MIV - Identificación del vehículo."
                  },
                  "IS.5.3": {
                    "id": "IS.5.3",
                    "pilarId": "IS",
                    "estandarId": "IS.5",
                    "requerimientoOperacional": "Deben estar en condiciones seguras de uso:\r\n  - Vehículos de campo;\r\n  - Montacargas (si los hubiera);\r\n  - Camiones para transporte de máquinas (si los hubiera).",
                    "comoEvaluar": "Elija aleatoriamente 3 vehículos de campo, 1 montacargas y 1 camión y verifique que las condiciones de los neumáticos, faros, linternas, flechas, espejos y parabrisas estén en uso seguro."
                  }
                }
              },
              "IS.6": {
                "id": "IS.6",
                "descripcion": "Organización del Taller",
                "requisitos": {
                  "IS.6.1": {
                    "id": "IS.6.1",
                    "pilarId": "IS",
                    "estandarId": "IS.6",
                    "requerimientoOperacional": "Organización y limpieza del taller:\r\na) El Gerente de Servicio o el Jefe del Taller debe garantizar la condición permanente de organización y limpieza del taller, monitoreando el CRONOGRAMA MENSUAL DE 5S´s, con fechas y nombres del Responsable para la aplicación semanal del checklist de las 5S´s . También debe ponerlo a disposición de todos los empleados, de todos los Departamentos del Concesionario en los cuadros de gestión de a la vista;\r\nb) Se debe elaborar un plan con las acciones y plazos de implementación para revertir las no conformidades y hacerlas disponibles en un cuadro de gestión a la vista;\r\nc) El objetivo mínimo de cumplimiento para la lista de verificación de las 5S debe ser del 90%.",
                    "comoEvaluar": "a) Verificar el nivel de organización y limpieza del taller en todas las etapas del proyecto Power Service. Solicite el CRONOGRAMA MENSUAL DE 5S's y verifique su publicación en las tablas de gestión a la vista del Concesionario. La información debe estar completa y las Listas de Verificación 5S aplicadas dentro de los plazos de ejecución (Semanal).\nb) Solicitar el Plan de Acción para los elementos no cumplidos, verificar su disponibilidad en el cuadro de gestión a la vista del taller. Las acciones deben completarse dentro de los plazos de ejecución.\nc) Aplicar la lista de verificación de las 5S y verificar si se alcanza la meta del 90% de cumplimiento."
                  }
                }
              },
              "IS.7": {
                "id": "IS.7",
                "descripcion": "Seguridad en el Trabajo",
                "requisitos": {
                  "IS.7.1": {
                    "id": "IS.7.1",
                    "pilarId": "IS",
                    "estandarId": "IS.7",
                    "requerimientoOperacional": "Seguridad:\r\na) Limitar el área de circulación del Taller para Empleados que no pertenezcan al taller, proveedores de servicios y visitantes;\r\nb) Poner Equipos de Protección Personal (EPP's) a disposición de todo aquel que supere los límites de seguridad definidos en el Taller, con, como mínimo, gafas de seguridad (para quienes utilicen gafas graduadas, disponibilizar gafas superpuestas) y protección auditiva, según Ley 19587 ( norma reguladora);\r\nc) Los Técnicos deberán utilizar, durante la ejecución del servicio (en campo o en taller), el mínimo de EPP's necesarios para garantizar su seguridad e integridad durante la ejecución de sus tareas;\r\n- siempre: gafas de seguridad y, para quienes lleven gafas graduadas, gafas superpuestas o gafas de seguridad graduadas, protectores auditivos, calzado de seguridad, guantes (químicos o físicos).\r\n- cuando se aplicable: mono y máscara de protección química, cinturón de seguridad, mallas, casco de seguridad.\r\nd) Los Concesionarios que cuenten con un Profesional Responsable y Acreditado en Seguridad Ocupacional, prevalecerán las normas y lineamientos que éste determine, los cuales deberán ser presentados en un documento formal y firmado por él y los empleados responsables del sector Postventa.",
                    "comoEvaluar": "a) Verificar que el área de circulación de otros empleados, prestadores de servicios y visitantes esté debidamente definida y que el acceso sea restringido y respetado.\nb) Verificar la disponibilidad de EPP's para todo aquel que supere los límites de seguridad establecidos para el área del taller, y si se respeta su uso.\nc) Verificar que los Técnicos utilicen correctamente los EPP adecuados para la ejecución de cada actividad, según se requiera.\nd) Verificar, en el documento formal referido a Seguridad Laboral del Concesionario, las firmas del responsable del sector Postventa y del responsable de seguridad. Chequear la Acreditación del Profesional Responsable, si es aplicable."
                  }
                }
              }
            }
          },
          "MS": {
            "id": "MS",
            "nombre": "Marketing de Servicio",
            "estandares": {
              "MS.1": {
                "id": "MS.1",
                "descripcion": "Análisis de Perfil del Cliente",
                "requisitos": {
                  "MS.1.1": {
                    "id": "MS.1.1",
                    "pilarId": "MS",
                    "estandarId": "MS.1",
                    "requerimientoOperacional": "El Concesionario deberá mantener actualizado el registro de Cliente, considerando la información personal, comercial y del parque de maquinaria.",
                    "comoEvaluar": "Consulte el sistema de registro de Clientes del Concesionario y verifique cómo lo actualizan.\r\nSeleccione 3 Clientes que han contratado servicios en el último año y pongasé en contacto para comprobar si, como mínimo, sus datos personales y comerciales están actualizados. (Nombre, dirección, cumpleaños)"
                  },
                  "MS.1.2": {
                    "id": "MS.1.2",
                    "pilarId": "MS",
                    "estandarId": "MS.1",
                    "requerimientoOperacional": "Con base en el registro de Clientes del Concesionario y los datos de facturación de Servicios y Repuestos, el Representante Comercial de Servicios deberá realizar anualmente un análisis del Potencial de Compras de Servicios del Cliente, a fin de Clasificar el perfil de cada uno. El análisis debe considerar:\r\n- La flota de máquinas y equipos de cada Cliente;\r\n- La variación de compras en el Taller, al menos, de los últimos 2 años, para identificar si el Cliente está creciendo, bajando o inactivo;\r\n- La viabilidad de la Venta de Servicios, identificando Clientes en mora o que definitivamente no prestan servicios en la Concesionaria.\r\nVERIFICAR LA TABLA PRIME ACTION \"1_POTENCIAL_DE_COMPRA\".",
                    "comoEvaluar": "Verificar:\r\n- Si el Análisis de mercado se realiza y se actualiza anualmente;\r\n- Si la herramienta clasifica a los clientes en función de su potencial de compra;\r\n- Si se lleva a cabo una evaluación de la variación en el comportamiento de compra del cliente;\r\n- Si se identifican Clientes sin viabilidad para la venta de servicios;"
                  },
                  "MS.1.3": {
                    "id": "MS.1.3",
                    "pilarId": "MS",
                    "estandarId": "MS.1",
                    "requerimientoOperacional": "Se debe utilizar: el Modelo de Clasificación de Clientes del Power Service, o los Sistemas CRM del Concesionario, u otros Sistemas de Inteligencia de Mercado.",
                    "comoEvaluar": "Verificar el tipo de herramienta utilizada para realizar la Clasificación de Clientes y si es funcional, cumpliendo con los criterios de análisis de mercado."
                  },
                  "MS.1.4": {
                    "id": "MS.1.4",
                    "pilarId": "MS",
                    "estandarId": "MS.1",
                    "requerimientoOperacional": "El análisis de potencial y clasificación de los Clientes del Concesionario debe realizarse con el apoyo de los Departamentos de Repuestos y de Ventas.",
                    "comoEvaluar": "Verificar si el análisis de potencial y clasificación de Clientes realizado involucró a las áreas de Ventas y Repuestos, mediante el acta de la junta o firma de los participantes. Interrogar al Responsable del Departamento de Repuestos sobre su participación en el trabajo realizado."
                  }
                }
              },
              "MS.2": {
                "id": "MS.2",
                "descripcion": "Análisis de Perfil del Mercado",
                "requisitos": {
                  "MS.2.1": {
                    "id": "MS.2.1",
                    "pilarId": "MS",
                    "estandarId": "MS.2",
                    "requerimientoOperacional": "En cada intervalo máximo de un año, el Representante de Servicio Comercial deberá realizar un BENCHMARKING con los talleres de Terceros y Concesionarios competidores en la región, analizando:\r\n- Nivel de servicio: ¿Tiene algún equipo especial? ¿Ofrecen algo que agrada al Cliente? ¿Tiene alguna acción que promueva la agilidad?\r\n- Política comercial - ¿Cuál es la tarifa por hora? ¿Existe variación por tipo de máquina? ¿Por horario? ¿Ofrece turnos de postventa durante los períodos de cosecha? ¿Los desplazamientos son cobrados? ¿Es cobrado para llevar la máquina al taller? ¿Ofrece facilidades de pago que permiten una percepción diferenciada del cliente?\r\n- Instalaciones: ¿El taller está organizado y limpio? ¿Tiene fácil acceso?\r\n- Marketing: ¿El Taller se difunde en redes locales y / o sociales? ¿Cómo es la accesibilidad del website y qué se ofrece?\r\nVERIFICAR LA TABLA PRIME ACTION \"2_BENCHMARKING\".",
                    "comoEvaluar": "Solicite el material de resultados del Benchmarking y compruebe si el análisis de los resultados obtenidos a través del estudio incluye:\r\n- una periodicidad igual o inferior a 1 año; y\r\n- el nivel de profundidad de investigación solicitado por el requerimiento.\r\nAnalizar la coherencia entre los resultados obtenidos en el Análisis de Mercado y la Política de Servicios Comerciales resultante del mismo."
                  },
                  "MS.2.2": {
                    "id": "MS.2.2",
                    "pilarId": "MS",
                    "estandarId": "MS.2",
                    "requerimientoOperacional": "El Representante de Servicio Comercial deberá realizar, poco tiempo después de concluido el Benchmarking, una Presentación Ejecutiva a los gerentes del Concesionario, mostrando:\r\n- Las Buenas Prácticas encontradas en cada competidor, que se pueden aplicar en el Concesionario;\r\n- Las debilidades / deficiencias percibidas en cada competidor y que pueden utilizarse como argumento para la negociación con los Clientes;\r\n- Propuestas estratégicas sobre cómo promover y llevar a cabo la Venta de Paquetes de Servicio, Repuestos y otras ventas.",
                    "comoEvaluar": "Solicitar el material de presentación y consultar la fecha de la realización. Y si los puntos cubiertos cumplen con el requerimiento de esta Norma, tanto en cantidad como en calidad de información."
                  }
                }
              },
              "MS.3": {
                "id": "MS.3",
                "descripcion": "Desarrollo de Paquetes de Servicios",
                "requisitos": {
                  "MS.3.1": {
                    "id": "MS.3.1",
                    "pilarId": "MS",
                    "estandarId": "MS.3",
                    "requerimientoOperacional": "El Representante de Servicios Comerciales deberá, junto con los Gerentes, desarrollar y mantener al menos un Paquete de Servicios de cada tipo a continuación, vigente, en funcionamiento activo, según el período de cosecha:\r\n- Paquete de servicios elaborado por el Concesionario;\r\n- Paquete de servicio proporcionado por John Deere;\r\n- Paquete de servicios conectados;\r\n- Paquete de servicio remoto;\r\n- El Paquete de Servicio se puede ofrecer durante el servicio de los Técnicos.\r\nVERIFICAR LA TABLA PRIME ACTION \"3_PLANEJAMENTO_DE_PACOTES / SIMULADOR / PORTFÓLIO",
                    "comoEvaluar": "Verificar si existe al menos 1 Paquete de Servicios de cada tipo solicitado por el requerimiento y si están vigentes en el momento, según el período de cosecha."
                  },
                  "MS.3.2": {
                    "id": "MS.3.2",
                    "pilarId": "MS",
                    "estandarId": "MS.3",
                    "requerimientoOperacional": "Los Paquetes de Servicios deberán ser registrados en el Service Admin",
                    "comoEvaluar": "Verifique si los Paquetes de Servicios y los Tipos de Servicios ofrecidos por el Concesionario están registrados con el Service Admin."
                  }
                }
              },
              "MS.4": {
                "id": "MS.4",
                "descripcion": "Estructuración de Campañas de Ventas",
                "requisitos": {
                  "MS.4.1": {
                    "id": "MS.4.1",
                    "pilarId": "MS",
                    "estandarId": "MS.4",
                    "requerimientoOperacional": "El Representante de Servicios Comerciales deberá elaborar un Mapa de Cultivos Agrícolas de la región, identificando los Ciclos Agrícolas y los momentos idóneos para ofrecer los Paquetes, así como para la realización de los Servicios para cada plataforma de máquinas.\r\nVERIFICAR LA TABLA PRIME ACTION \"3_PLANEJAMENTO_DE_PACOTES / MAPA AGRÍCOLA",
                    "comoEvaluar": "Verificar la existencia y cumplimentación del Mapa de Cultivos Agrícolas, el cual debe contener el cronograma de la oferta y prestación de servicios para cada Plataforma y Ciclo Agrícola."
                  },
                  "MS.4.2": {
                    "id": "MS.4.2",
                    "pilarId": "MS",
                    "estandarId": "MS.4",
                    "requerimientoOperacional": "Junto con los Gerentes de Taller y Repuestos, el Representante de Ventas de Servicio debe definir un cronograma para las campañas de venta de paquetes de servicio, basado en los paquetes desarrollados para cada ciclo de cultivo agrícola actual.\r\nCada Campaña debe estar estructurada, conteniendo al menos:\r\n- Lista de Paquetes de Servicios ofrecidos por el Concesionario;\r\n- Plataforma o línea de productos servida;\r\n- Fecha de inicio y finalización;\r\n- Objetivo de ventas, en número de paquetes y / o en valores;\r\n- Resultado de Ventas, en número de Paquetes y / o en cantidades.\r\nVERIFICAR LA TABLA PRIME ACTION \"3_PLANEJAMENTO_DE_PACOTES / CRONOGRAMA",
                    "comoEvaluar": "Compruebe si hay campañas de ventas planificadas para el año en curso, si hay campañas en curso o si ya han sucedido en los últimos 12 meses. Analizar, en cada campaña, qué segmento / línea incluye y si reúne todas las culturas atendidas por el Concesionario."
                  },
                  "MS.4.3": {
                    "id": "MS.4.3",
                    "pilarId": "MS",
                    "estandarId": "MS.4",
                    "requerimientoOperacional": "Utilice un sistema CRM para ayudar a programar contactos con clientes y registrar resultados.",
                    "comoEvaluar": "Verificar la existencia y uso de un CRM o control específico."
                  },
                  "MS.4.4": {
                    "id": "MS.4.4",
                    "pilarId": "MS",
                    "estandarId": "MS.4",
                    "requerimientoOperacional": "Divulgar contenidos y periodos de las Campañas Post-Venta a los empleados de todas las áreas del Concesionario que atienden a los Clientes, animándolos a ofrecer los Paquetes de Servicios.",
                    "comoEvaluar": "Preguntar a 03 Empleados involucrados en la Venta de Servicios y verificar si conocen la existencia del Portfolio de Servicios que se ofrece a los Clientes y si saben dónde consultarlo."
                  }
                }
              },
              "MS.5": {
                "id": "MS.5",
                "descripcion": "Divulgación de Campañas de Ventas",
                "requisitos": {
                  "MS.5.1": {
                    "id": "MS.5.1",
                    "pilarId": "MS",
                    "estandarId": "MS.5",
                    "requerimientoOperacional": "El Responsable de Marketing del Concesionario deberá planificar las acciones de difusión de los Paquetes de Servicios, Campañas y participación en eventos regionales, en base a un Plan de Medios previamente acordado con el Gerente de Servicios.\r\nVERIFICAR LA TABLA PRIME ACTION \"4_PLANEJAMENTO_CAMPANHAS_E_EVENTOS / PLANO DE MÍDIA\"",
                    "comoEvaluar": "Verificar la existencia de un Plan de Medios para la difusión de Paquetes de Servicios y Campañas, y verificar si realmente se utiliza."
                  },
                  "MS.5.2": {
                    "id": "MS.5.2",
                    "pilarId": "MS",
                    "estandarId": "MS.5",
                    "requerimientoOperacional": "Establecer los medios de comunicación y la secuencia de contactos para la difusión de cada Campaña de Marketing o Ventas, en base a la Clasificación de cada Cliente, calculando los costos que implica el uso de cada medio contratado.\r\nVERIFICAR LA TABLA PRIME ACTION \"4_PLANEJAMENTO_CAMPANHAS_E_EVENTOS / PLANIFICACIÓN DE CONTACTO\"",
                    "comoEvaluar": "Verifique cómo se establecieron los medios de difusión, la frecuencia y los costos de los medios utilizados para cada Campaña."
                  },
                  "MS.5.3": {
                    "id": "MS.5.3",
                    "pilarId": "MS",
                    "estandarId": "MS.5",
                    "requerimientoOperacional": "El Concesionario deberá contratar y mantener cuentas corporativas en al menos dos Redes Sociales, tales como: Facebook, Instagram, Twitter, LinkedIn, YouTube, etc.\r\nPara seleccionar las Redes, se debe analizar cuáles permiten mayor cobertura de acceso con Clientes de la región.",
                    "comoEvaluar": "Verificar la presencia activa del Departamento de Posventa del Concesionario con las Redes Sociales y su desempeño en cuanto a publicaciones y número de seguidores."
                  },
                  "MS.5.4": {
                    "id": "MS.5.4",
                    "pilarId": "MS",
                    "estandarId": "MS.5",
                    "requerimientoOperacional": "El sitio web del Concesionario debe proporcionar:\r\n- Dirección, teléfono y horario de apertura actualizados del Taller;\r\n- Seguimiento de clientes potenciales e interacción rápida con los mensajes de los clientes;\r\n- Solicitud en línea de programación de servicios;\r\n- Divulgación de campañas y paquetes de servicios disponibles;\r\n- Un área de acceso al comercio electrónico para paquetes de servicios.",
                    "comoEvaluar": "Acceda al sitio web del Concesionario y evalúe si se cumplen los requisitos del Estándar."
                  },
                  "MS.5.5": {
                    "id": "MS.5.5",
                    "pilarId": "MS",
                    "estandarId": "MS.5",
                    "requerimientoOperacional": "El Concesionario deberá definir un profesional para mantener activa y actualizada la Página Web y las Redes Sociales, realizando:\r\n- Desarrollo de contenido web para publicitar campañas de venta de servicios;\r\n- Publicaciones de campaña vigentes o que se lanzarán en un futuro próximo, monitoreo frecuente de clientes potenciales y respuestas rápidas a los contactos del Cliente;\r\n- Monitorear el tipo y cantidad de accesos;\r\n- Monitorear y responder rápidamente a solicitudes y comentarios;\r\n- Interactuar con seguidores.",
                    "comoEvaluar": "Verificar la existencia del profesional que administra y monitorea el sitio web del Concesionario y observa si ha mantenido las Redes Sociales activas, como se describe en el requerimiento."
                  },
                  "MS.5.6": {
                    "id": "MS.5.6",
                    "pilarId": "MS",
                    "estandarId": "MS.5",
                    "requerimientoOperacional": "El Concesionario debe adoptar y utilizar un modelo estándar de materiales publicitarios (pancartas / carpetas / catálogos) de Paquetes de Servicios que incluya, al menos:\r\n- Descripción de los Servicios a realizar;\r\n- Descripción de todas las partes a reemplazar;\r\n- Valor;\r\n- Condiciones de pago;\r\n- Ventajas operativas del Paquete;\r\n- Ventajas económicas del Paquete;",
                    "comoEvaluar": "Verifique la existencia de los materiales de divulgación enumerados en el requerimiento y si cumplen con las exigencias."
                  },
                  "MS.5.7": {
                    "id": "MS.5.7",
                    "pilarId": "MS",
                    "estandarId": "MS.5",
                    "requerimientoOperacional": "Asegurar la disponibilidad de materiales promocionales de las Campañas vigentes en el mostrador de repuestos del Concesionario y en la zona de espera del Cliente.",
                    "comoEvaluar": "Verifique si existen materiales promocionales para las Campañas en los lugares especificados por el requerimiento."
                  }
                }
              },
              "MS.6": {
                "id": "MS.6",
                "descripcion": "Participación en Eventos Regionales",
                "requisitos": {
                  "MS.6.1": {
                    "id": "MS.6.1",
                    "pilarId": "MS",
                    "estandarId": "MS.6",
                    "requerimientoOperacional": "Participación en eventos regionales:\r\na) El Responsable por las Acciones de Comercialización del Concesionario deberá elaborar un Calendario Anual de Eventos regionales o en el propio Concesionario, con la posibilidad de generar oportunidades de venta de Servicios.\r\nb) El Gerente de Servicio Corporativo y / o Postventa, junto con el Gerente de Servicio, deberán elegir los eventos de interés para la participación del Departamento de Postventa;\r\nc) El Responsable de las Acciones de Marketing del Concesionario deberá planificar la participación del Área de Servicio en los eventos seleccionados\r\nVERIFICAR LA TABLA PRIME ACTION \"4_PLANEJAMENTO_CAMPANHAS_E_EVENTOS / CALENDARIO DE EVENTOS\"",
                    "comoEvaluar": "Analizar el calendario de Eventos Regionales y si existe evidencia de evaluación de viabilidad de participación por parte de los Gerentes de Postventa."
                  }
                }
              }
            }
          },
          "VS": {
            "id": "VS",
            "nombre": "Venta de Servicio",
            "estandares": {
              "VS.1": {
                "id": "VS.1",
                "descripcion": "Política de Servicios",
                "requisitos": {
                  "VS.1.1": {
                    "id": "VS.1.1",
                    "pilarId": "VS",
                    "estandarId": "VS.1",
                    "requerimientoOperacional": "El Gerente de Servicio Corporativo y / o Postventa y / o Gerente de Servicio debe desarrollar una Política de Servicios que contenga:\r\n- Valor de la mano de obra para los departamentos de ventas, repuestos y administrativo;\r\n- Valor por hora de la mano de obra por servicio de campo y servicio de taller y / o por servicios programados x Spot;\r\n- Valor de kilometraje o valor de viaje por hora;\r\n- Valor por soporte remoto (por llamada, hora o tarifa mensual);\r\n- Transporte de Máquinas y Equipos;\r\n- Política de descuentos y Condiciones Comerciales.",
                    "comoEvaluar": "Solicite la Política de Servicios y verifique si se cumple con todos los requisitos."
                  },
                  "VS.1.2": {
                    "id": "VS.1.2",
                    "pilarId": "VS",
                    "estandarId": "VS.1",
                    "requerimientoOperacional": "La Política de Servicios debe ser aprobada y archivada;",
                    "comoEvaluar": "Verifique que la Política de Servicios esté aprobada por la Diretoría."
                  },
                  "VS.1.3": {
                    "id": "VS.1.3",
                    "pilarId": "VS",
                    "estandarId": "VS.1",
                    "requerimientoOperacional": "Presentar formalmente la Política de Servicios para los empleados directa e indirectamente involucrados en la venta de servicios y orientarlos en su uso.",
                    "comoEvaluar": "Preguntar a 3 Empleados si tienen conocimiento de la Política de Servicios y verificar cual es el método de divulgación de la Política a los empleados."
                  }
                }
              },
              "VS.2": {
                "id": "VS.2",
                "descripcion": "Plan de Metas",
                "requisitos": {
                  "VS.2.1": {
                    "id": "VS.2.1",
                    "pilarId": "VS",
                    "estandarId": "VS.2",
                    "requerimientoOperacional": "\r\nEl Gerente de Servicio o Postventa debe definir los Objetivos de Ventas de Servicio y Actividades considerando:\r\n- Período de vigencia para la consecución de las metas a alcanzar;\r\n- Objetivos estipulados por John Deere;\r\n- Potencial del Mercado de Servicios del Concesionario;\r\n- Capacidad de horas de mano de obra según el equipo técnico del Concesionario;\r\n- Historial de desempeño de las ventas de servicios;\r\n- Punto de equilibrio del Departamento de Servicio. ",
                    "comoEvaluar": "Solicitar al Gerente de Servicio que muestre el período de vigencia definido, los objetivos estipulados por JD que se tomaron en cuenta, si se utilizó la hoja de cálculo de potencial de mercado, el cálculo de la capacidad técnica del MO, el historial considerado y el punto de equilibrio del Departamento de Servicios."
                  },
                  "VS.2.2": {
                    "id": "VS.2.2",
                    "pilarId": "VS",
                    "estandarId": "VS.2",
                    "requerimientoOperacional": "El Gerente de Servicio o Postventa debe implementar los objetivos de ventas establecidos en:\r\n- Facturación de fábrica (Garantía y PMP);\r\n- Facturación en Servicios SPOT;\r\n- Facturación de Paquetes de Servicios.",
                    "comoEvaluar": "Busque una hoja de cálculo o un sistema que muestre los objetivos de ventas establecidos para cada categoría de Facturación."
                  },
                  "VS.2.3": {
                    "id": "VS.2.3",
                    "pilarId": "VS",
                    "estandarId": "VS.2",
                    "requerimientoOperacional": "El Gerente de Servicio o Postventa debe:\r\na) Definir, formalizar, capacitar y divulgar quién será el responsable de la Venta de Servicios y Paquetes;\r\nb) Comunicar / alinear metas y orientar al equipo de Ventas de Servicios;\r\nc) Para los objetivos y metas no alcanzados previamente, establecer Planes de Acción preventivos y correctivos y monitorear su evolución.\r\nc) Buscar la implicación del resto de departamentos: Repuestos, Soluciones Integradas, Administrativo y Comercial, mediante acciones sinérgicas que ayuden a alcanzar las metas y objetivos establecidos.",
                    "comoEvaluar": "a) Verificar quiénes son oficialmente responsables de la Venta de Servicios y Paquetes, incluido el Representante de Asistencia de Campo (RAC).\nb) Verifique cómo se comunican los objetivos y las pautas al equipo de Ventas. Cuestionar a los miembros del equipo si conocen el plan de metas y si recibieron las pautas necesarias.\nc) Verificar 1 Plan de Acción elaborado para los objetivos y metas no alcanzados.\nd) Verificar la implicación de los otros departamentos: Repuestos, Administrativo y Comercial en la consecución de las metas y objetivos establecidos."
                  }
                }
              },
              "VS.3": {
                "id": "VS.3",
                "descripcion": "Contacto y Presentación de la Propuesta",
                "requisitos": {
                  "VS.3.1": {
                    "id": "VS.3.1",
                    "pilarId": "VS",
                    "estandarId": "VS.3",
                    "requerimientoOperacional": "El Responsable de la Venta de Servicios deberá preparar las actividades de acercamiento y contacto con los Clientes de acuerdo a las estrategias establecidas en el Estándar de Marketing de Servicios, considerando:\r\n- Lista de clientes y formulario de contacto (llamadas telefónicas, visitas, WhatsApp, correos electrónicos, etc.);\r\n- Las metas y objetivos relacionados con cada segmento de clientes (número de contactos y / o visitas a realizar);\r\n- Historial e información (personas clave, máquinas, operaciones, cultura, interacciones y servicios realizados) de los Clientes a contactar;\r\n- Un cronograma de contactos periódicos (semanales, quincenales o mensuales), según la estrategia definida por la Política Comercial y enfocados a un enfoque consultivo de los asuntos planificados.",
                    "comoEvaluar": "Consultar con el responsable de Venta de Servicios si se realiza la preparación de acercamiento y contacto con Clientes, y si se consideran todos los ítems del requerimiento."
                  },
                  "VS.3.2": {
                    "id": "VS.3.2",
                    "pilarId": "VS",
                    "estandarId": "VS.3",
                    "requerimientoOperacional": "Si el Cliente manifiesta interés, el Responsable de la Venta de Servicios deberá preparar y enviar / entregar una propuesta de venta que incluya los siguientes ítems:\r\n- Servicios que se proporcionarán;\r\n- Calendario de prestación de servicios;\r\n- Beneficios que el Cliente obtendrá con el negocio (preferiblemente cuantitativos);\r\n- Describir las ventajas del cliente al realizar los servicios con el Concesionario;\r\n- Propuesta comercial y condiciones de pago",
                    "comoEvaluar": "Analice si las propuestas de ventas incluyen todos los elementos enumerados en VS.1.2"
                  },
                  "VS.3.3": {
                    "id": "VS.3.3",
                    "pilarId": "VS",
                    "estandarId": "VS.3",
                    "requerimientoOperacional": "El Responsable por la Venta de Servicios debe registrar la información para controlar la interacción con los Clientes.\r\nEn este proceso de control y registro deben incluirse las Listas de Verificación de Prospección de la Ejecución del Servicio en Campo, traídas por los Técnicos.",
                    "comoEvaluar": "Verificar en el Registro de Información, el control y el adjunto de las respectivas Listas de Verificación de Prospección de la Ejecución del Servicio en Campo traídas por los Técnicos."
                  },
                  "VS.3.4": {
                    "id": "VS.3.4",
                    "pilarId": "VS",
                    "estandarId": "VS.3",
                    "requerimientoOperacional": "La Administración del Servicio debe, semanalmente, recopilar y tabular los datos de contacto y ventas y actualizar el historial de la cartera de Clientes para el correcto manejo de la información.",
                    "comoEvaluar": "Compruebe si la tabulación de los datos de los contactos realizados, las ventas realizadas y la actualización del historial de la cartera de Clientes se realiza de forma eficaz semanalmente."
                  }
                }
              },
              "VS.4": {
                "id": "VS.4",
                "descripcion": "Negociación y Cierre",
                "requisitos": {
                  "VS.4.1": {
                    "id": "VS.4.1",
                    "pilarId": "VS",
                    "estandarId": "VS.4",
                    "requerimientoOperacional": "El responsable por la Venta de Servicios debe:\r\na) Realizar un seguimiento de las propuestas enviadas y abordar de forma clara las posibles dudas u objeciones de los Clientes sobre las propuestas y servicios que integran las ofertas;\r\nb) Transferir el manejo de las objeciones más contundentes al Gerente de Servicio y definir una nueva estrategia de negociación en los casos de ineficiencia de la anterior. Si es necesario, preparar una nueva propuesta de venta para el Cliente;\r\nc) Si la propuesta es rechazada, registrar y registrar las razones de la venta perdida en el sistema;\r\nd) Al obtener la aceptación del Cliente, el Responsable por la Venta de Servicios deberá registrar en el Sistema todos los detalles de la negociación:\r\ne) Las propuestas de negociación deben incluir, al menos, los siguientes elementos:\r\n     - Servicios y / o Paquetes que componen la propuesta de venta;\r\n     - Importe total y métodos de pago;\r\n     - Lista de repuestos que integran el servicio;\r\n     - Fecha probable de ejecución del servicio;\r\nf) Informar diariamente las ventas realizadas al Responsable del Apuntamiento, para que pueda programar la Ejecución del Servicio en el Cuadro de Programación y Apuntamiento.",
                    "comoEvaluar": "a) Monitorear 03 seguimientos y verificar si las posibles dudas u objeciones de los Clientes sobre las propuestas y servicios que componen las ofertas están siendo atendidas de manera clara.\nb) Verificar cómo se manejan los puntos muertos y fallos en las negociaciones y si existen revisiones de las propuestas en base a las objeciones y dudas de los Clientes.\nc) Verificar si los registros de ventas perdidos están contabilizados en el sistema o en un control específico.\nd) Verificar si los historiales comerciales están siendo registrados en el sistema o en un control específico\ne) Verificar en 3 propuestas de negociación que se cumplan todos los ítems del requisito.\nf) Verificar si (y cómo) se realiza la comunicación de ventas de Paquetes / Servicios al Responsable de Programación, y si procede a programar la Ejecución del Servicio en el Cuadro de Programación y Apuntamiento."
                  },
                  "VS.4.2": {
                    "id": "VS.4.2",
                    "pilarId": "VS",
                    "estandarId": "VS.4",
                    "requerimientoOperacional": "El Gerente de Servicio o Postventa debe:\r\n- Monitorear diariamente todas las negociaciones en curso con clientes potenciales;\r\n- Asegurar los registros de todos los contactos realizados (que resulten en ventas perdidas o ventas) en el sistema o control específico del Concesionario;\r\n- Revalidar y / o ajustar propuestas en curso, si es necesario.\r\n- Evaluar los resultados de las propuestas generadas versus propuestas negociadas y, si es necesario, redefinir las estrategias de contactos y metas;\r\n- Consolidar y analizar ventas perdidas para establecer Planes de Acción.",
                    "comoEvaluar": "Verifique si el Gerente de Servicio o Post-Venta monitorea diariamente las negociaciones en curso y asegura los registros de todos los contactos (tasa de cierre de propuestas, ventas perdidas y respectivos Planes de Acción) en el Sistema o control específico."
                  }
                }
              },
              "VS.5": {
                "id": "VS.5",
                "descripcion": "Revisiones",
                "requisitos": {
                  "VS.5.1": {
                    "id": "VS.5.1",
                    "pilarId": "VS",
                    "estandarId": "VS.5",
                    "requerimientoOperacional": "El Concesionario debe:\r\n- Controlar las máquinas equipadas con JDLink;\r\n- Mantener actualizados los contadores de horas de las máquinas que no tienen JDLink, utilizando el promedio horario reportado por el cliente y / o Reportes de Ejecución del Servicio;\r\n- Registrar los Planes de Revisión de cada modelo en el sistema o control específico.",
                    "comoEvaluar": "Compruebe que se actualicen los contadores de horas del parque de máquinas.\nCompruebe si los Planes de Revisión de cada modelo están registrados en el Sistema o bajo un control específico."
                  },
                  "VS.5.2": {
                    "id": "VS.5.2",
                    "pilarId": "VS",
                    "estandarId": "VS.5",
                    "requerimientoOperacional": "El Responsable por la Programación y Apuntamiento debe:\r\na) Verificación diaria del sistema o control específico para verificar las máquinas que necesitan una revisión programada;\r\nb) Utilizar un script (que contenga: apertura, propósito del contacto, manejo de objeciones, cierre y despido) para contactar a los respectivos Clientes, buscando apuntar las Revisiones Programadas;\r\nc) Si hay \"aceptación\" por parte del Cliente, proceda como en el Estándar de Programación y Apuntamiento. Si la máquina en cuestión ha funcionado menos horas de las esperadas, consulte con el Cliente para una fecha futura para la revisión programada.",
                    "comoEvaluar": "a) Verificar si el responsable por Programación y Apuntamiento consulta diariamente el sistema o control específico para verificar las máquinas que necesitan Revisión Programada.\nb) Verificar si el Responsable de Programación y Apuntamiento tiene un script estándar para contactar a los respectivos Clientes, buscando programar las Revisiones Programadas.\r\nRastree 03 llamadas y verifique el uso del script en las llamadas a clientes.\nc) Si el Cliente expresa interés, observar si la Persona Responsable por la Programación y Apuntamiento procede como en el Estándar de Programación y Apuntamiento;"
                  },
                  "VS.5.3": {
                    "id": "VS.5.3",
                    "pilarId": "VS",
                    "estandarId": "VS.5",
                    "requerimientoOperacional": "Si el Cliente no muestra interés o ya realizó la Revisión con un tercero, la Persona Responsable por la Programación y Apuntamiento debe actualizar el contador de horas de la máquina específica, registrar el motivo por el cual no se realizó la revisión y programar un nuevo contacto.",
                    "comoEvaluar": "Tenga en cuenta que cuando el Cliente no muestra interés o ya ha realizado la Revisión con un tercero, el Responsable de Programación y Apuntamiento comprueba si el contador de horas de la máquina está actualizado y se registra el motivo por el que no se realizó la revisión. Compruebe si hay un nuevo contacto programado."
                  }
                }
              }
            }
          },
          "PA": {
            "id": "PA",
            "nombre": "Programación y Agendamiento",
            "estandares": {
              "PA.1": {
                "id": "PA.1",
                "descripcion": "Programación de los Servicios",
                "requisitos": {
                  "PA.1.1": {
                    "id": "PA.1.1",
                    "pilarId": "PA",
                    "estandarId": "PA.1",
                    "requerimientoOperacional": "El Responsable por la Programación y Apuntamiento debe analizar diariamente, entre todos los servicios programados, cuales probablemente se apuntarán para los próximos 5 días:\r\n- Revisiones, reformas, inspecciones;\r\n- Servicios demandados por John Deere: Garantías y PMP's;\r\n- Paquetes de servicios con fechas programadas;\r\n- Servicios internos: Entrega técnica, Preparación de la entrega, etc.).",
                    "comoEvaluar": "Consultar con el Responsable por la Programación y Apuntamiento si los procedimientos de rutina, en relación a los servicios que se pueden programar, cumplen con el requisito."
                  },
                  "PA.1.2": {
                    "id": "PA.1.2",
                    "pilarId": "PA",
                    "estandarId": "PA.1",
                    "requerimientoOperacional": "El Responsable por la Programación y Apuntamiento deberá dejar en la Agenda de cada día un tiempo disponible para la realización de los Servicios SPOT, teniendo como referencia:\r\n- El historial de solicitudes de los clientes;\r\n- El período de cosecha;\r\n- Periodos meteorológicos en los que el Cliente detiene sus máquinas.",
                    "comoEvaluar": "Verifique in loco si la Programación incluye,en todos los días, tiempo disponible para los Servicios Spot."
                  },
                  "PA.1.3": {
                    "id": "PA.1.3",
                    "pilarId": "PA",
                    "estandarId": "PA.1",
                    "requerimientoOperacional": "Elaborar Pre OS / Solicitud de Servicios Programados, con el fin de obtener visibilidad en la ejecución de los servicios apuntados y programarlos brindando:\r\n- Duración de los servicios y / o paquetes, según disponibilidad del Técnico más adecuado para la ejecución;\r\n- Desplazamiento, si lo hubiera;\r\n- Fecha prevista o sugerida / acordada con el Cliente.",
                    "comoEvaluar": "Verifique el uso de Pre-OS / Solicitud de servicio para la programación de servicios que se pueden apuntar y seleccione aleatoriamente 5 Pre-OS o Solicitudes de servicio y verifique si están insertadas en el Cuadro de Programación y Apuntamiento."
                  },
                  "PA.1.4": {
                    "id": "PA.1.4",
                    "pilarId": "PA",
                    "estandarId": "PA.1",
                    "requerimientoOperacional": "Todos los Servicios deben ser programados tan pronto cuando se acuerde con el Cliente la fecha probable de ejecución, buscando maximizar al máximo el tiempo de viaje del Técnico entre visitas (PA.6 - Enrutamiento).",
                    "comoEvaluar": "Verifique en la selección de los 5 Servicios del íten anterior si las fechas publicadas en el Cuadro de Programación y Apuntamiento están de acuerdo con la fecha de Ejecución del Servicio acordada con el Cliente al momento de cerrar la venta."
                  },
                  "PA.1.5": {
                    "id": "PA.1.5",
                    "pilarId": "PA",
                    "estandarId": "PA.1",
                    "requerimientoOperacional": "El Concesionario debe tener una gestión a la vista de las programaciones y de los controles de apuntamientos.",
                    "comoEvaluar": "Compruebe si se generaron los Pre-OS / Solicitud de servicio y si están asignados de una manera que permita la gestión a la vista."
                  }
                }
              },
              "PA.2": {
                "id": "PA.2",
                "descripcion": "Apuntamiento del Servicio Programado",
                "requisitos": {
                  "PA.2.1": {
                    "id": "PA.2.1",
                    "pilarId": "PA",
                    "estandarId": "PA.2",
                    "requerimientoOperacional": "El Responsable por la Programación y Apuntamiento debe:\r\na) Verificar diariamente la disponibilidad de las piezas incluidas en la Solicitudes de Servicio / Pre-OS y sus respectivos Servicios programados;\r\nb) En caso de indisponibilidad de los repuestos necesarios para realizar los servicios, debe asegurarse de que el Gerente de Repuestos esté oficialmente informado, para solicitar la compra a John Deere;\r\nc) Con la llegada prevista de los repuestos, y si es necesario, reprogramar la fecha de ejecución del servicio con el Cliente;\r\nd) El Gerente de repuestos debe comunicar de manera inmediata y oficial al Responsable por la Programación cuando haya repuestos disponibles.",
                    "comoEvaluar": "a) Verificar en la Pre-OS / Solicitud de Servicio analizado y en los OS que estén asignados de manera que permita la gestión a la vista, si los repuestos solicitados están disponibles.\nb) Compruebe, en los casos en que no haya repuestos disponibles, si el Departamento de Repuestos ha enviado la solicitud de compra para John Deere.\nc) Verificar la evidencia de que las fechas de ejecución del servicio han sido reprogramadas con el Cliente.\nd) Consultar con el Responsable del Departamento de Repuestos si es - y cómo - se realiza la comunicación de los repuestos que están disponibles y si existe evidencia de esta comunicación."
                  },
                  "PA.2.2": {
                    "id": "PA.2.2",
                    "pilarId": "PA",
                    "estandarId": "PA.2",
                    "requerimientoOperacional": "A medida que los repuestos estén disponibles, la persona Responsable por la Programación y Apuntamiento debe:\r\na) Contactar al Cliente para confirmar la fecha programada para la ejecución del servicio;\r\nb) Luego de confirmar la fecha de ejecución, informar a los Responsables de reservar y separar los repuestos de los respectivos servicios a realizar;\r\nc) En caso de no confirmación por parte del Cliente, reprogramar el servicio apuntado para una nueva fecha;\r\nd) La fecha de finalización de los servicios programados deberá ser confirmada con el Cliente, próxima a su finalización;\r\ne) Proceder a la apertura de la OS (PA.5.1) con el respectivo Servicio Programado a realizar y actualizar la Programación y Programación (PA.6.1) y el registro, si es necesario.",
                    "comoEvaluar": "a) Observe si se contacta con el Cliente para confirmar la fecha programada. Solicite evidencia a sus contactos.\nb) Tras la confirmación por parte del Cliente, observe si el Responsable de Repuestos es contactado y los repuestos, por él, son separados y reservados.\nc) Observar si, en caso de no confirmación por parte del Cliente, se reprograma el servicio.\nd) Observar in loco las confirmaciones de servicio con los Clientes en la víspera de sus apuntamientos y solicitar evidencia de estos contactos.\ne) Compruebe si las OS se abren después de la confirmación por parte del cliente y si la programación y apuntamiento están actualizadas."
                  }
                }
              },
              "PA.3": {
                "id": "PA.3",
                "descripcion": "Atendimiento a la Solicitud SPOT",
                "requisitos": {
                  "PA.3.1": {
                    "id": "PA.3.1",
                    "pilarId": "PA",
                    "estandarId": "PA.3",
                    "requerimientoOperacional": "Llamadas telefónicas en el Concesionario:\r\na) Deben ser contestadas hasta el 3er timbre y utilizar un script de servicio recomendado por la empresa;\r\nb) Si el Cliente solicita un departamento específico o alguien, la transferencia debe realizarse dentro de los 30 segundos y el nuevo servicio también debe ser respondido hasta el 3er timbre.",
                    "comoEvaluar": "a) A lo largo del día, verifique en 03 llamadas, si el servicio telefónico del Concesionario se realiza como máximo hasta el tercer timbre y si se usa un script agradable - si el Concesionario no tiene un script, establezca uno, usando ejemplos de buenas prácticas .\nb) Consulta los casos en los que necesitas transferir extensiones, si las transferencias ocurren en un plazo máximo de 30 segundos."
                  },
                  "PA.3.2": {
                    "id": "PA.3.2",
                    "pilarId": "PA",
                    "estandarId": "PA.3",
                    "requerimientoOperacional": "Las llamadas telefónicas en el Taller deben ser atendidas hasta el 3er timbre y utilizar un script de servicio recomendado por la empresa.",
                    "comoEvaluar": "a) A lo largo del día verifique, en 03 llamadas, si el servicio telefónico del Taller se realiza como máximo hasta el tercer timbre y si se usa un script agradable - si el Concesionario no tiene script, establezca uno usando ejemplos de buenas prácticas."
                  },
                  "PA.3.3": {
                    "id": "PA.3.3",
                    "pilarId": "PA",
                    "estandarId": "PA.3",
                    "requerimientoOperacional": "Las llamadas a través de WhatsApp u otra aplicación deben responderse en un plazo máximo de 1 hora desde la recepción de todos los contactos del Cliente.",
                    "comoEvaluar": "Verifique y registre 3 llamadas a través de WhatsApp u otra aplicación si el tiempo de respuesta cumple con el requisito."
                  },
                  "PA.3.4": {
                    "id": "PA.3.4",
                    "pilarId": "PA",
                    "estandarId": "PA.3",
                    "requerimientoOperacional": "Las asistencias por correo deben ser contestadas en un plazo máximo de 1 día hábil, desde la recepción del contacto del Cliente;",
                    "comoEvaluar": "Verifique en 3 asistencias vía e-mail si el tiempo de respuesta cumple con el requisito."
                  },
                  "PA.3.5": {
                    "id": "PA.3.5",
                    "pilarId": "PA",
                    "estandarId": "PA.3",
                    "requerimientoOperacional": "Pregunte al cliente sobre el motivo de la llamada / contacto y:\r\na) Si el motivo / problema requiere un diagnóstico en campo, programar una visita del Técnico al Cliente e informar las condiciones comerciales del diagnóstico (cuando corresponda);\r\nb) Si el motivo / problema requiere un diagnóstico en el Taller, programar la llegada de la máquina e informar las condiciones comerciales del diagnóstico y transporte (cuando corresponda);\r\nc) Si el motivo / problema permite un diagnóstico telefónico, el responsable debe aplicar el Menú de Síntomas.",
                    "comoEvaluar": "Solicite el proceso de 2 llamadas para cada caso y verifique que, en cada caso, se ha cumplido con el requisito."
                  }
                }
              },
              "PA.4": {
                "id": "PA.4",
                "descripcion": "Menú de Síntomas y Presupuesto",
                "requisitos": {
                  "PA.4.1": {
                    "id": "PA.4.1",
                    "pilarId": "PA",
                    "estandarId": "PA.4",
                    "requerimientoOperacional": "El Responsable por aplicar el Menú de Síntomas y Presupuesto debe:\r\na) Estar atento a la información que es reportada por el Cliente;\r\nb) Registrar en detalle todas las solicitudes del Cliente, utilizando los términos mencionados por él;\r\nc) Si se identifica que el servicio no requiere intervención presencial, reenvíe la llamada al Responsable del Servicio Remoto. Si el responsable es el propio asistente, continuar con el servicio, siguiendo el Estándar ER.2;\r\nd) Utilizando los servicios enumerados en el Menú de síntomas, verifique la disponibilidad de repuestos;\r\ne) Si los repuestos no están disponibles, verifique la hora de llegada;\r\nf) Con la información sobre disponibilidad de repuestos, completar el Presupuesto para la ejecución del servicio, incluyendo las condiciones de pago comercial;\r\ng) Informar al Cliente sobre el servicio a realizar, la previsión del presupuesto, las condiciones comerciales y el plazo para la prestación del servicio;\r\nh) Ofrecer otros Servicios o Paquetes (Revisiones, Inspecciones, Campañas, entre otros) como complemento al presupuesto;\r\ni) Después de la aprobación del Presupuesto, solicite al Departamento de Repuestos que compre los artículos faltantes y reenvíe el proceso a la Persona Responsable por Programar y Apuntar Servicios y abrir la OS.",
                    "comoEvaluar": "a, b) Verificar, en 3 registros de pre-diagnóstico, si el registro de solicitudes utiliza los términos exactos citados por el Cliente.\nc) Observar si el motivo del problema presentado se ajusta al tipo de asistencia del Servicio Remoto y si la llamada se desvía del Cliente al mismo, o, si el Responsable es el encargado, se inicia el procedimiento de asistencia siguiendo el Estándar ER-2.\nd) Verificar si en el procedimiento se verifica la disponibilidad de repuestos para el respectivo servicio.\ne,f,g) Verificar que el trámite que va desde la solicitud de compra, definiendo el plazo hasta la llegada de los repuestos, garantiza la comunicación inmediata al Cliente del presupuesto con las condiciones comerciales de pago.\nh) Compruebe en 03 llamadas si se ofrecen otros servicios al Cliente.\ni) Si el Cliente está de acuerdo, verifique si la información se envía al Departamento de Repuestos y al responsable de Programación y Apuntamiento, para que pueda abrir el OS."
                  }
                }
              },
              "PA.5": {
                "id": "PA.5",
                "descripcion": "Apertura de la O.S.",
                "requisitos": {
                  "PA.5.1": {
                    "id": "PA.5.1",
                    "pilarId": "PA",
                    "estandarId": "PA.5",
                    "requerimientoOperacional": "El Responsable por la Administración de Servicio o el empleado designado por el Gerente de Posventa / Gerente de Servicio debe:\r\na) Acceder al Registro de Clientes y, si es necesario, actualizarlo;\r\nb) Abra el sistema operativo y asegúrese de que esté lleno de:\r\n- todos los datos de registro del cliente requeridos por el sistema operativo:\r\n- Responsable de aprobación o pago;\r\n- Correo electrónico de la persona responsable de la aprobación o el pago;\r\n- Modelo de equipo, chasis, cronómetro;\r\n- Descripción del pre-diagnóstico y servicios a realizar, así como los plazos prometidos;\r\n- Previsión de valor del presupuesto;\r\n- Técnico designado.\r\nc) Solicitar repuestos y herramientas;\r\nd) Cada OS, cuando sea posible, debe tener adjunto su respectivo Menú de Síntomas y / o Presupuesto disponible para el Técnico.",
                    "comoEvaluar": "a) En las 03 asistencias monitoreadas, observe si los registros del Cliente están actualizados.\nb) Verificar 3 OS asignados en el Bin (físico o electrónico) \"Esperando Ejecución del Servicio\" si contiene toda la información recomendada:.\nc) Verificar 3 OS asignados en el Bin (físico o electrónico) \"En espera de ejecución del servicio\", si se requieren los repuestos y herramientas.\nd) Verifique en el Bin (físico o electrónico) si cada OS tiene, cuando corresponda, adjunto su respectivo Menú de Síntoma y / o Presupuesto."
                  }
                }
              },
              "PA.6": {
                "id": "PA.6",
                "descripcion": "Enrutamiento y Programación",
                "requisitos": {
                  "PA.6.1": {
                    "id": "PA.6.1",
                    "pilarId": "PA",
                    "estandarId": "PA.6",
                    "requerimientoOperacional": "El Responsable por la Programación y Apuntamiento debe:\r\n a) Verificar qué Técnico es el más adecuado, según el tipo de servicio y especialización requerida, para realizar el servicio;\r\n b) Buscar optimizar el itinerario de la visita, distribuyendo los servicios de acuerdo a las prioridades (Spot / Apuntados / Servicios Programados), ubicaciones y tiempo total de ejecución de los servicios por período (sobre un día, semana, etc.);\r\n c) Desarrollar guiones lógicos, desde el punto de salida y regreso, e Insertar los OS's del día en la casilla \"Próximo Servicio\" del Cuadro de Programación y Apuntamiento.\r\n d) Para una perfecta optimización de rutas, es necesario que el Programador tenga a mano: TMO's de los servicios a realizar (o previsión de un especialista), capacidad operativa del equipo, ubicación geográfica de todos los Clientes y la Matriz de Competencias actualizada de el técnico;\r\n e) Enviar copia de los servicios programados (impresos o electrónicamente) al Departamento de Repuestos, con al menos un día de anticipación, para la separación previa de los elementos necesarios para la ejecución de los servicios programados.",
                    "comoEvaluar": "a) Verifique en 3 apuntamientos si el Responsable por la Programación tiene la matriz de competencias del equipo técnico, cumplimentada y actualizada y consúltela para definir el Técnico más adecuado. \nb) Verificar si el Responsable por la Programación ha optimizado la Agenda del Técnico, teniendo en cuenta los desplazamientos, los servicios a realizar y las prioridades.\nc) Verificar la lógica del enrutamiento de los Técnicos y verificar la actualización del Cuadro de Programación y Apuntamiento con los OS programados para el día.\nd) Verificar si el responsable por la Programación y Apuntamienton cuenta con los TMO's de los servicios a realizar (o recibe los tiempos brindados por un especialista), la capacidad operativa del equipo y la ubicación geográfica de los Clientes, además de la Matriz de Habilidades de los técnicos.\ne) Verifique en 3 apuntamientos si el Responsable por kla Programación remitió copias de los servicios programados al Departamento de Repuestos dentro del período estipulado."
                  },
                  "PA.6.2": {
                    "id": "PA.6.2",
                    "pilarId": "PA",
                    "estandarId": "PA.6",
                    "requerimientoOperacional": "El Gerente de Servicio debe asegurarse de que todo el control de la programación del servicio lo lleve a cabo EXCLUSIVAMENTE el Programador, y que cualquier necesidad de modificar el horario de los Técnicos durante la ejecución del servicio se lo comunique a él inmediatamente.",
                    "comoEvaluar": "Monitorear la operación de control de programación del servicio y verificar si el Gerente de Servicio garantiza la gestión exclusiva de la Agenda al responsable por Programación y Apuntamiento."
                  }
                }
              }
            }
          },
          "EC": {
            "id": "EC",
            "nombre": "Ejecución de Servicio en Campo",
            "estandares": {
              "EC.1": {
                "id": "EC.1",
                "descripcion": "Retirada de Repuestos y Herramientas",
                "requisitos": {
                  "EC.1.1": {
                    "id": "EC.1.1",
                    "pilarId": "EC",
                    "estandarId": "EC.1",
                    "requerimientoOperacional": "El Técnico, antes de iniciar la ejecución del servicio en campo, deberá:\r\na) Retirar la OS con la información del servicio a ejecutar en el contenedor (físico o electrónico) \"Esperando servicio\";\r\nb) Retirar los repuestos, previamente solicitados y separados;\r\nc) Verificar que todos los repuestos solicitados y entregados sean suficientes para la ejecución del servicio; Si es necesario incluir otros repuestos, el técnico debe solicitarlos al Departamento de Repuestos a través del Responsable por la Programación.\r\nd) Si no hay disponibilidad de algun repuesto fundamental para la ejecución del servicio, informar al Responsable por la Programación y Apuntamiento n para que se comunique con el Cliente y reprograme una nueva fecha;\r\ne) Retire las herramientas solicitadas previamente.",
                    "comoEvaluar": "a) Solicite 5 OS's que se encuentren en el contenedor \"Esperando servicio\" (físico o electrónico) y verifique que los repuestos estén descritos.\nb) Verifique con el Departamento de Repuestos si todos los elementos solicitados en las 5 OS's fueron previamente separados en \"cestas\" identificadas con el número de cada OS (picking) y están disponibles para el Técnico.\nc) Verificar que se hayan entregado todos los repuestos solicitados, incluidos los agregados por el Técnico mediante Programación, si corresponde.\nd) En caso de indisponibilidad de algun repuesto, verifique el procedimiento de información (sistema o control específico) entre Repuestos y Programación y si se notifica al Cliente para reprogramar una nueva fecha antes de la hora de servicio programada.\ne) Verificar si las herramientas se solicitan a través de un sistema o control específico con al menos UN DÍA DE AVANCE, evitando que haya dos servicios programados a la vez que requieran las mismas herramientas"
                  }
                }
              },
              "EC.2": {
                "id": "EC.2",
                "descripcion": "Traslado a la máquina",
                "requisitos": {
                  "EC.2.1": {
                    "id": "EC.2.1",
                    "pilarId": "EC",
                    "estandarId": "EC.2",
                    "requerimientoOperacional": "El Técnico debe, antes de salir a realizar el servicio:\r\na) Contactar al Cliente o Responsable:\r\n  . Confirme la ubicación de la máquina a reparar;\r\n  . Verifique la información contenida en el Menú de Síntomas y las conclusiones del pre-diagnóstico realizado;\r\n  . Proporcionar una estimación de la hora de llegada a la ubicación de la máquina;\r\n  . Si es necesario, solicite al Cliente que deje la máquina apagada con tiempo suficiente para que se enfríe y se pueda realizar el servicio en cuanto llegue el Técnico;\r\nb) Empacar la caja de herramientas, repuestos y herramientas comunes (herramientas especiales), de forma segura y organizada, en el vehículo;\r\nc) Realizar la LISTA DE VERIFICACIÓN DE SALIDA DE CAMPO antes de acudir al servicio, registrando formalmente el estado de los elementos de la lista de verificación, según lo recomendado por el Concesionario;\r\nd) Tome nota de las horas dedicadas a la preparación de la salida (organización de la OS, busca por los repuestos y herramientas, preparación y organización del vehículo, aplicación de la lista de verificación);\r\ne) Viajar al Cliente, respetando las leyes y normas de tránsito del Concesionario;\r\nf) Registrar la hora y el kilometraje inicial y final en la Hoja de Trabajo de Uso del Vehículo y en la OS o Informe de Ejecución del Servicio, detallando en el documento que se presentará para la firma del cliente el tiempo de viaje.",
                    "comoEvaluar": "a) Dar seguimiento a 2 llamadas de Técnicos a Clientes o al registro formal de llamadas de Técnicos y verificar si se cumplen los requisitos.\nb) Monitorear el empaque de los repuestos y herramientas de los técnicos en los vehículos de campo y verificar que cumplan con los requisitos de organización y seguridad necesarios.\nc) Monitorear la realización de la lista de verificación de campo, según lo recomendado por el Concesionario, y verificar si el Técnico cumple con todos los ítems incluidos en la lista.\nd) Verificar si el Técnico señaló el tiempo dedicado a la preparación para la salida (organización de la OS, busca por repuestos y herramientas, preparación, organización del vehículo y aplicación de la lista de verificación).\ne) Verificar durante el seguimiento de Técnicos en campo, si se respetan las normas y leyes de tránsito del Concesionario.\nf) Verifique si el Técnico anotó el kilometraje inicial y final en la OS o en el Informe de Servicio y anotó el tiempo de viaje con el documento que se presentará para la firma del cliente."
                  }
                }
              },
              "EC.3": {
                "id": "EC.3",
                "descripcion": "Confirmación del Diagnóstico",
                "requisitos": {
                  "EC.3.1": {
                    "id": "EC.3.1",
                    "pilarId": "EC",
                    "estandarId": "EC.3",
                    "requerimientoOperacional": "Al llegar a la máquina a ser atendida, el Técnico debe:\r\na) Informar al Cliente o Responsable de monitorear el servicio de su llegada al lugar acordado;\r\nb) Utilice el EPP: gafas, guantes (químicos o físicos), protectores para los oídos, zapatos de seguridad y, en su caso, mono, máscara, cinturón de seguridad, gorro.\r\nc) Realizar el diagnóstico siguiendo los “7 PASOS DEL DIAGNÓSTICO”. En la dificultad de hacer el diagnóstico, verifique si existe un problema similar en el DTAC;\r\nd) Registrar en el Informe de Ejecución del Servicio la \"VOZ DEL CLIENTE\" (términos exactos descritos por él), las pruebas realizadas, la conclusión del diagnóstico y los servicios a aplicar como solución.\r\ne) Señalar los tiempos utilizados para realizar las pruebas / diagnósticos y los servicios realizados;\r\nf) Si hay servicio adicional, evaluar si es posible realizarlo con las piezas disponibles. De lo contrario, anote en el Informe de ejecución del servicio la necesidad de reprogramar el servicio adicional encontrado;\r\ng) Si es posible, solicitar la autorización del Cliente con la firma correspondiente.",
                    "comoEvaluar": "a) Verificar que el Cliente o Responsable de seguimiento del servicio esté informado de la llegada del Técnico\nb) Verificar si el Técnico utiliza el EPP adecuado a los riesgos derivados del tipo de servicio.\nc) Observe si se aplican los “7 PASOS DE DIAGNÓSTICO”. Pregunte al técnico sobre los 07 pasos de diagnóstico. Observe, en su caso, si tiene acceso y si sabe acceder a la solución DTAC.\nd) Verificar en el servicio acompañado y en 5 Reportes de Ejecución del Servicio ya cerrados, la calidad de información de la \"Voz del Cliente\", las pruebas realizadas, la conclusión del diagnóstico y los servicios aplicados como solución.\ne) Verificar si se registran las horas utilizadas para las pruebas / diagnósticos y los servicios realizados.\nf) Monitorear el procedimiento para casos de servicios adicionales y cumplir con todos los ítems del requisito.\ng) Para los casos seguidos, si es necesario un servicio adicional, verifique la solicitud de firma del Cliente antes de la ejecución del mismo. Verifique 5 OS's cerradas que necesitaban servicios adicionales si se recolectaban las firmas de los clientes."
                  }
                }
              },
              "EC.4": {
                "id": "EC.4",
                "descripcion": "Aprobación del \r\nCliente",
                "requisitos": {
                  "EC.4.1": {
                    "id": "EC.4.1",
                    "pilarId": "EC",
                    "estandarId": "EC.4",
                    "requerimientoOperacional": "Una vez completado el diagnóstico, el técnico debe:\r\na) Presentar en detalle las conclusiones del diagnóstico identificado en el Menú de Síntomas, mostrando el servicio a realizar y los servicios adicionales;\r\nb) Detallar el presupuesto con valores de repuestos, tiempo, desplazamiento y valor de M.Obra para realizar el servicio, solicitando aprobación previa;\r\nc) Si es un servicio que se puede pagar en Garantía, informar al Cliente sobre el proceso a seguir;\r\nd) Registrar en el Informe de Ejecución del Servicio la descripción del servicio aprobado por el Cliente o Responsable, el nombre del aprobador y la hora de aprobación;\r\ne) Si no se aprueba el presupuesto, registrar en el Informe de Ejecución del Servicio el motivo, el momento del diagnóstico y solicitar la firma del Cliente o Responsable;\r\nf) En caso de necesidad de programar un nuevo horario para realizar los servicios adicionales encontrados al momento del diagnóstico, informar al Cliente que el Responsable de Programación se comunicará con usted.",
                    "comoEvaluar": "a) Hacer un seguimiento in loco de la presentación de las conclusiones del diagnóstico y comprobar si están detalladas. Observe si se evidencia el servicio a realizar y cualquier servicio adicional, comparándolos con el Menú de Síntomas.\nb,c) Verificar si la información pertinente a los valores de desplazamiento, los repuestos que se utilizarán y el proceso de Mano de Obra, Garantía (si lo hubiere) y el tiempo requerido para realizar el servicio han sido transmitidos al Cliente o Responsable.\nd) Verifique que el nombre del aprobador y la hora de aprobación se anotaron en el Informe de ejecución del servicio.\ne) Verificar que, en caso de no aprobación del presupuesto, el Técnico registra en el Informe de Ejecución del Servicio el motivo de la no aprobación del Cliente, el tiempo del diagnóstico y solicita la firma del Cliente o Responsable.\nf) Verificar que el Cliente esté informado de la necesidad de realizar un servicio adicional, encontrado al momento del diagnóstico y que no será posible realizarlo en el presente servicio, que el Responsable de Programación se comunicará con usted para programar un nuevo servicio, aclarando los motivos de la imposibilidad de finalización (ausencia de piezas y / o herramientas, tiempo disponible por parte del Técnico, etc.)"
                  }
                }
              },
              "EC.5": {
                "id": "EC.5",
                "descripcion": "Ejecución del Servicio Aprobado",
                "requisitos": {
                  "EC.5.1": {
                    "id": "EC.5.1",
                    "pilarId": "EC",
                    "estandarId": "EC.5",
                    "requerimientoOperacional": "Al iniciar el servicio, el Técnico debe:\r\na) Colocar fundas protectoras en el asiento, en el piso y proteger el volante, joystick y palanca de cambio con film plástico, y utilizar los EPPs adecuados al entorno y tipo de servicio a realizar;\r\nb) Realizar el servicio de acuerdo con las pautas del Manual Técnico disponible en el Service ADVISOR ™, almacenando los repuestos desmontados en un lugar adecuado;\r\nc) Identificar cualquier problema nuevo, verificar la posibilidad de continuar la ejecución del Servicio con las piezas y herramientas disponibles;\r\n- Si es imposible continuar, contacte con el taller, verificando la posibilidad de enviar piezas y herramientas adicionales;\r\n- Si no hay disponibilidad para recibir, informar al Cliente sobre el problema, la solución y el plazo para su devolución para finalizar el servicio;\r\nd) Una vez finalizado el servicio, realice las pruebas finales para asegurarse de que el problema se haya solucionado por completo;\r\ne) Complete el Informe de ejecución del servicio con la información recomendada.",
                    "comoEvaluar": "a) Verificar el uso de fundas protectoras según sea necesario y el uso correcto de los EPPs relevantes al tipo de servicio\nb) Observar si el Técnico sigue las pautas del Manual Técnico disponible en el Service ADVISOR ™ y si el embalaje de los repuestos desmontados se realiza en un lugar adecuado.\nc) Verificar, al identificar un nuevo problema y si no hay posibilidad de continuidad del servicio, si el Técnico contacta con el taller para verificar la posibilidad de enviar piezas y herramientas adicionales. Si esto no es posible, se informa al Cliente sobre el nuevo problema identificado y la imposibilidad de solucionarlo, así como el plazo de devolución.\nd) Compruebe si, una vez finalizado el servicio, se han realizado las pruebas finales para asegurarse de que se ha solucionado el problema.\ne) Verificar que el Informe de Ejecución del Servicio esté completo, con toda la información recomendada por el Informe de Ejecución del Servicio."
                  }
                }
              },
              "EC.6": {
                "id": "EC.6",
                "descripcion": "Entrega y Cierre",
                "requisitos": {
                  "EC.6.1": {
                    "id": "EC.6.1",
                    "pilarId": "EC",
                    "estandarId": "EC.6",
                    "requerimientoOperacional": "Una vez finalizado el Servicio, el Técnico debe:\r\na) Informar al Cliente / Responsable sobre la finalización del servicio;\r\nb) Aplicar la Lista de Verificación (Entrega) en la máquina donde se realizó el servicio, invitando al Cliente / Responsable a acompañarlo;\r\nc) Explicar el servicio realizado al Cliente / Responsable, indicando: Servicios realizados, repuestos reemplazados, valor final del servicio y cualquier problema encontrado durante la verificación;\r\nd) Tratar las dudas u objeciones sobre el servicio prestado;\r\ne) Recoger la firma del Cliente o responsable en la 1ª Copia del Informe de Ejecución del Servicio y entregarle una copia;\r\nf) Verificar la existencia de otras máquinas para aplicar una Lista de Verificación;\r\ng) Si existe la oportunidad de generar nuevos negocios, proceda con el siguiente paso de “Prospección de oportunidades” (EC.7);\r\nh) Señale el tiempo necesario para realizar el servicio.",
                    "comoEvaluar": "a) Verificar si el Técnico informa al Cliente o responsable sobre la finalización del servicio.\nb) Verificar si el técnico utiliza la Lista de Verificación (Entrega) en la máquina donde se realizó el servicio;\nc) Verificar si se realiza la explicación del Servicio realizado por el Cliente o Responsable, informando todos los servicios realizados, las piezas reemplazadas, el valor final del servicio y cualquier problema encontrado.\nd) Verificar, en caso de duda u objeción sobre el Servicio realizado, si el Técnico está preparado para atenderlas de forma coherente.\ne) Verificar que se recoja la firma del Cliente o responsable y que se entregue al Cliente copia del Informe de Ejecución del Servicio.\nf) Verifique si el técnico tiene dudas sobre la existencia de otras máquinas y si es posible, solicite permiso para aplicar la Lista de verificación de prospección.\ng) Observar si el Técnico registra el tiempo para conclusión del Servicio."
                  }
                }
              },
              "EC.7": {
                "id": "EC.7",
                "descripcion": "Oportunidad de Prospección",
                "requisitos": {
                  "EC.7.1": {
                    "id": "EC.7.1",
                    "pilarId": "EC",
                    "estandarId": "EC.7",
                    "requerimientoOperacional": "El Técnico debe ofrecer al Cliente la verificación de otras máquinas / equipos sin compromiso y, si hay oportunidad, realizar los siguientes pasos:\r\na) Realizar la Lista de verificación de prospección en el equipo e identificar si existe la necesidad de algún servicio;\r\nb) Si es posible realizar el servicio identificado en la aplicación de la Lista de Verificación de Prospección, presentar en detalle al Cliente / Responsable el diagnóstico y presupuesto del servicio a realizar;\r\nc) Si el Cliente aprueba el servicio prospectado, el Técnico deberá registrarlo en un nuevo Informe de Ejecución del Servicio y recoger la firma de autorización previa del Cliente, pasando a seguir los pasos de “Ejecución del Servicio” (EC.5) y “Entrega y Cierre” (EC.7).\r\nd) Si no es posible realizar el servicio prospectado (por falta de repuestos, herramientas o tiempo), pregunte al Cliente / Responsable sobre la mejor fecha para una nueva cita e informe que el Responsable de Programar el Concesionario se comunicará con usted para realizar la programación;\r\ne) Si el Cliente no aprueba el presupuesto, registre el motivo de la no aprobación en el Informe de Ejecución del Servicio, solicitando al Cliente / Responsable reconocer la negativa para solucionar el problema identificado mediante firma. El Técnico debe agradecer al cliente e informar verbalmente al Asistente Administrativo de la negativa.",
                    "comoEvaluar": "a) Observar si el Técnico ofrece la verificación en otras máquinas existentes en el lugar donde se realiza el servicio y se aplica correctamente la Lista de Verificación de Prospección.\nb) Observar si, en la posibilidad de realizar el servicio prospectado, el Técnico presenta al Cliente / Responsable el Diagnóstico y Presupuesto detallado del servicio a realizar.\nc) Observar si, con la aprobación del servicio prospectado, el Técnico lo registra en un nuevo Informe de Ejecución del Servicio y sigue los pasos de “Ejecución del Servicio” (EC.5) y “Entrega y Cierre” (EC. 7).\nd) Verificar si ante la imposibilidad de realizar el servicio prospectado por falta de repuestos, herramientas o por falta de tiempo, el Técnico pregunta al Cliente cuál es la mejor fecha para una nueva cita e informa que el Responsable de Programación se pondrá en contacto con él para realizar la programación.\ne) Observar si, en el caso de no aprobación del servicio prospectado, el Técnico agradece, registra la información pertinente a la denegación en el Informe de Ejecución del Servicio y el motivo de la no aprobación y solicita la firma del Cliente. Verifique si el Técnico va al próximo servicio / regresa al Concesionario;\r\nAnalizar en 5 OS's los motivos de la no aprobación, en su caso, y si los Reportes de Ejecución del Servicio cuentan con las firmas de los Clientes / Responsables."
                  }
                }
              },
              "EC.8": {
                "id": "EC.8",
                "descripcion": "Regreso y Traslado al próximo servicio",
                "requisitos": {
                  "EC.8.1": {
                    "id": "EC.8.1",
                    "pilarId": "EC",
                    "estandarId": "EC.8",
                    "requerimientoOperacional": "Al regresar al Concesionario, el Técnico deberá:\r\na) Apuntar el desplazamiento de regreso del Cliente;\r\nb) Para los servicios no completados por falta de repuestos, herramientas o tiempo, deposite la OS en el BIN de \"Servicios en espera de repuestos\" e informe al Gerente de Repuestos y al Asistente Administrativo del servicio interrumpido, para reprogramar el reparo - si el control es electrónico, informar al Administrador de Servicios para que apunte el nuevo horario en el Sistema;\r\nc) Depositar el Informe de Ejecución del Servicio firmado, la OS firmada y las Listas de Verificación de Prospección realizadas en el BIN de \"Servicios Terminados\" - si el control es electrónico, informar al Administrador del Servicio para que pueda apuntar en el sistema nuevas programaciones para los servicios prospectados confirmados;\r\nd) Devolver los repuestos no aplicadas al Departamento de Repuestos;\r\ne) Presentar el DTAC, si corresponde;\r\nf) Realizar el Reporte de Gastos de los gastos del día / semana y solicitar un anticipo para la ejecución de los siguientes servicios, de ser necesario;\r\ng) Organizar los repuestos y herramientas para los servicios a realizar al día siguiente.",
                    "comoEvaluar": "a) Monitorear la llegada del Técnico al Concesionario y verificar si toma nota del desplazamiento de regreso del Cliente (kilometraje y tiempo).\nb, c, d) Monitorear la llegada del Técnico al Concesionario y verificar si deposita la OS en el bin correspondiente e informa al Administrador de Servicios para su lanzamiento en el Sistema. Verificar si el Técnico informa al Responsable de Repuestos de la necesidad de que los elementos faltantes terminen los servicios interrumpidos y si procede con la correcta devolución de los repuestos no utilizadas\ne,f,g) Monitorear la llegada del Técnico al Concesionario y verificar que envíe el DTAC, cuando corresponda, y proceda con el Informe de Gastos y solicitud anticipada, cuando sea necesario. Observar si, disponiendo de tiempo, el Técnico organiza las piezas y herramientas para los Servicios a realizar al día siguiente."
                  },
                  "EC.8.2": {
                    "id": "EC.8.2",
                    "pilarId": "EC",
                    "estandarId": "EC.8",
                    "requerimientoOperacional": "El Asistente Administrativo debe:\r\na) Verificar la correcta cumplimentación de todos los campos en el Informe de ejecución del servicio y en la OS y, si se requiere algún ajuste, devolverlos al Técnico para su corrección;\r\nb) Actualizar el progreso del trabajo en el sistema, si lo hubiera;\r\nc) Solicitar la Programación del Servicio al Responsable de Programación, en caso de que existan nuevos servicios por realizar (interrumpidos o prospectados).",
                    "comoEvaluar": "a,b,c) Verifique que el Asistente administrativo cumpla con todos los pasos descritos en el requisito."
                  },
                  "EC.8.3": {
                    "id": "EC.8.3",
                    "pilarId": "EC",
                    "estandarId": "EC.8",
                    "requerimientoOperacional": "De acuerdo con el Informe de Ejecución del Servicio y la OS, el Asistente Administrativo debe actualizar el Sistema con la información contenida en el Informe y en la OS, cerrar la OS y proceder con la facturación.",
                    "comoEvaluar": "Verifique que el Asistente administrativo cumpla con el requisito."
                  }
                }
              }
            }
          },
          "ET": {
            "id": "ET",
            "nombre": "Ejecución de Servicio en el Taller",
            "estandares": {
              "ET.1": {
                "id": "ET.1",
                "descripcion": "Recebimiento de la Maquina en el Taller",
                "requisitos": {
                  "EO.1.1": {
                    "id": "EO.1.1",
                    "pilarId": "ET",
                    "estandarId": "ET.1",
                    "requerimientoOperacional": "En todas las máquinas que llegan al Concesionario para realizar servicios:\r\na) Aplicar la LISTA DE VERIFICACIÓN DE INSPECCIÓN VISUAL en el momento en que la máquina se baja del camión (incluso antes de llevarla al taller);\r\nb) Al completar la Lista de verificación de inspección visual, solicite a la persona responsable del transporte de la máquina la firma y la fecha de entrega;\r\nc) Si la máquina ha sido retirada de las instalaciones del Cliente, bajo la responsabilidad del Concesionario, aplique la Lista de Verificación de Inspección Visual antes del envío y solicite al responsable de la entrega la firma y la fecha;\r\nd) Las fundas protectoras para el asiento, el piso y la envoltura plástica del volante, el joystick y la palanca de cambios deben colocarse a la llegada, inmediatamente después de la Lista de Verificación de Inspección Visual;\r\ne) Reenviar la máquina debidamente identificada visiblemente con Pre-OS, o QRCode y con la Lista de Verificación de Inspección Visual al box de servicio o estacionarla en un lugar apropiado.\r\nf) Si un Técnico realiza la recepción y preparación de la máquina, deberá proceder a la cita del horario para tales actividades.",
                    "comoEvaluar": "a, b) Verificar al menos 01 recibo y verifique que la lista de verificación se esté aplicando en el momento en que la máquina se baja del camión.\r\nVerifique en las máquinas que se encuentran en el taller que todas tengan la Lista de Verificación de Inspección Visual adjunta a la carpeta de Documentos de Servicio, debidamente llenada y firmada.\nc) Solicitar 05 OS's de Servicios realizados en el taller cuyo transporte estuvo a cargo del Concesionario y verificar si cuentan con la Lista de Verificación de Inspección Visual debidamente firmada por el Cliente / Responsable y fechada por él;\r\n\nd) Verificar que todas las máquinas del taller cuenten con fundas protectoras en el asiento y el suelo, además de las envolturas plásticas aplicadas al volante, joystick y palanca de cambios.\ne) Verificar que todas las máquinas que se encuentren en el Taller para servicio tengan Pre-OS o OS o QRCode y con la Lista de Verificación de Inspección Visual pegada cerca de la cabina, en un lugar de fácil acceso, llenado y firmado.\nf) Verifique 5 OS's cuyos recibos / preparativos fueron hechos por un Técnico y verifique si hubo las notas apropiadas de las horas."
                  }
                }
              },
              "ET.2": {
                "id": "ET.2",
                "descripcion": "Confirmación del Diagnóstico",
                "requisitos": {
                  "EO.2.1": {
                    "id": "EO.2.1",
                    "pilarId": "ET",
                    "estandarId": "ET.2",
                    "requerimientoOperacional": "Al llegar a la maquina, el técnico debe:\r\na) Utilice los EPPs: gafas, guantes (químicos o físicos), protección auditiva, calzado de seguridad y, en su caso, mono, máscara, cinturón de seguridad, mallas, gorro.\r\nb) Realizar el diagnóstico siguiendo los “7 PASOS DEL DIAGNÓSTICO”. En la dificultad de hacer el diagnóstico, verifique si hay un problema similar con DTAC;\r\nc) Registrarse en Pre-OS, la \"Voz del Cliente\", (describa su descripción del problema, utilizando EXACTAMENTE los términos utilizados por él), las pruebas realizadas, la conclusión del diagnóstico, los servicios a aplicar como una solución y las partes necesarias;\r\nd) Verificar la disponibilidad de repuestos con el Departamento de Repuestos - En ausencia de repuestos en stock, el Gerente de Repuestos deberá informar al Técnico y Auxiliar Administrativo el plazo para su llegada y esperar la aprobación del presupuesto por parte del Cliente para solicitar el compra\r\ne) Informar al Auxiliar Administrativo sobre los resultados del diagnóstico, los servicios a realizar y el tiempo necesario para realizar los servicios;\r\nf) Si hay un servicio adicional, informar también al Asistente Administrativo;\r\ng) Señalar los tiempos utilizados para las pruebas / diagnóstico y los servicios realizados;",
                    "comoEvaluar": "a) Verificar durante los días de ejecución, y siempre que pase por el Taller, si los Técnicos están utilizando el EPP necesario y adecuado para la ejecución de la actividad en curso.\nb) Observe si los técnicos están siguiendo los \"7 pasos de diagnóstico\" y están utilizando el Service ADVISOR ™ y DTAC para realizar el diagnóstico cuando corresponda. Entreviste a dos técnicos para asegurarse de que los procedimientos se apliquen correctamente.\nc) Verificar en las OS's de las máquinas que se encuentran en el taller y en 5 OSs cerradas / Informe de Ejecución de Servicios si el Técnico llenó correctamente toda la información del requerimiento.\nd) Preguntar al Gerente de Partes y / o al Asistente Administrativo si y cómo se lleva a cabo el procedimiento para verificar la disponibilidad de partes por parte de los Técnicos.\ne,f) Preguntar al Auxiliar Administrativo si los Técnicos le informan sobre:\r\n     1) los resultados del diagnóstico;\r\n     2) los servicios a realizar;\r\n     3) el tiempo estimado para la ejecución total de los servicios; y\r\n     4) los servicios adicionales encontrados durante el diagnóstico.\ng) Verificar en el Informe de Ejecución del Servicio / Sistema de Señalamiento de las Maquinas que se encuentran en el taller si se registró el tiempo empleado para realizar el diagnóstico. Consulte las notas también en 5 OS's cerradas."
                  }
                }
              },
              "ET.3": {
                "id": "ET.3",
                "descripcion": "Diagnóstico y Presupuesto",
                "requisitos": {
                  "EO.3.1": {
                    "id": "EO.3.1",
                    "pilarId": "ET",
                    "estandarId": "ET.3",
                    "requerimientoOperacional": "El Asistente Administrativos de Servicios  debe:\r\na) Ponerse en contacto con el Cliente y presentar en detalle el presupuesto de los servicios a realizar, incluidos los servicios adicionales, cuando se identifiquen;\r\nb) Informar al Cliente de la disponibilidad de repuestos, notificándole de la totalidad del stock del Concesionario o, en caso de falta de algún artículo, de la necesidad de adquirirlo a John Deere, en cuyo caso, el plazo estimado entre la requisa y la llegada de la pieza faltante para iniciar el servicio. El AA deberá solicitar al Cliente la autorización de compra, informándole que dichas piezas se están comprando exclusivamente para ese servicio;\r\nc) Si es un servicio que se puede realizar bajo Garantía, informar al Cliente sobre el proceso;\r\nd) Aprovechar el momento para ofrecer servicios preventivos y lavado de equipos, así como negociar plazos de pago, incluyendo el momento del diagnóstico;\r\ne) Registrar servicios aprobados por el Cliente en la OS;\r\nf) Informar al Cliente que será contactado en caso de necesidad de servicios adicionales que, por casualidad, se identifiquen durante la realización de servicios previamente autorizados;\r\ng) Si el Cliente no aprueba el presupuesto, acordar el método de devolución de la máquina y, si hubo un valor acordado para el diagnóstico, proceder con el cobro;\r\nh) Registrar en la OS el motivo de la no aprobación e informar al responsable de análisis de marketing del Departamento de Servicios para el correcto registro en el embudo de ventas. ",
                    "comoEvaluar": "a) Acompañar 02 contactos con el Cliente para presentar el presupuesto y verificar si el Asistente Administrativo lo presenta en detalle, incluyendo (y principalmente) con los detalles de los servicios adicionales, cuando se identifiquen durante el diagnóstico.\nb) Verificar que el Asistente Administrativo informe al Cliente de la disponibilidad de piezas y, en caso de indisponibilidad, le informe de la llegada estimada de las piezas faltantes para iniciar el servicio. Verifique que el AA solicite claramente la autorización para comprar las piezas faltantes como se describe en el punto EO.3.1 (b).\nc) Verificar que el Cliente esté informado sobre los servicios que se pueden realizar en Garantía, cuando corresponda.\nd) Verificar si se ofrecen al Cliente otros servicios, como se ejemplifica en el requisito, y si se negocian las condiciones de pago.\ne) Verificar que el AA, durante el contacto, registre en la OS los servicios que fueron aprobados por el Cliente y, en las OS's que se encuentran en el bin (físico o electrónico) \"Esperando Servicio\", así como en 05 OS's cerradas, si hay evidencia de aprobación por parte del Cliente.\nf) Verificar que el Cliente esté informado de que, en caso de que surjan servicios adicionales durante la prestación del servicio, el Concesionario se comunicará con usted para informarle y solicitarle autorización para su prestación.\ng, h) Verificar que, en caso de no aprobación por parte del Cliente, el Asistente Administrativo disponga la devolución de la máquina, registre el motivo de la no aprobación y proceda con la recopilación del diagnóstico (cuando corresponda). Consultar también el procedimiento de envío de la información al responsable de análisis de marketing del Departamento de Servicios."
                  }
                }
              },
              "ET.4": {
                "id": "ET.4",
                "descripcion": "Solicitud de los Repuestos y Herramientas",
                "requisitos": {
                  "PA.4.1": {
                    "id": "PA.4.1",
                    "pilarId": "ET",
                    "estandarId": "ET.4",
                    "requerimientoOperacional": "El Asistente Administrativo o Técnico del Servicio debe solicitar al Responsable de Programación y Apuntamiento que incluya en el cronograma el servicio cuya OS abrirá, en la fecha prevista de llegada de los repuestos faltantes. Si es posible iniciar el servicio mientras los repuestos faltantes estén en tránsito (lavado / desmontaje de la máquina o realización de otros servicios aprobados e independientes), solicite autorización para la apertura inmediata de la OS al Service Manager.\r\nTambién debe enviar la solicitud de repuestos y herramientas a los departamentos correspondientes.",
                    "comoEvaluar": "Verificar en 05 OS cerrados la formalización del contacto con el Cliente y el registro de la nueva fecha prevista para el inicio de la ejecución del servicio. Compruebe si los registros coinciden con las fechas publicadas en la Agenda de Programación.\r\nVerificar los procedimientos de pedido de Repuestos y Herramientas Especiales y si estos, además de ser coherentes, obedecen como mínimo un día antes del inicio programado de ejecución del servicio."
                  },
                  "PA.4.2": {
                    "id": "PA.4.2",
                    "pilarId": "ET",
                    "estandarId": "ET.4",
                    "requerimientoOperacional": "El Responsable de Repuestos debe recoger los artículos enumerados en cada OS (picking) con al menos 1 día de antelación, asignándolos en \"canastas\" específicas (cajas, canastas o bin específico) e identificados con el número de OS al que se refiere.",
                    "comoEvaluar": "Verifique el procedimiento para comunicar la llegada de repuestos y la entrega de repuestos a los Técnicos. Verificar si el Jefe de Repuestos realiza el Picking, al menos, con un día de anticipación y asigna e identifica con la debida claridad la separación por el número de la OS."
                  },
                  "PA.4.3": {
                    "id": "PA.4.3",
                    "pilarId": "ET",
                    "estandarId": "ET.4",
                    "requerimientoOperacional": "El Técnico deberá solicitar y retirar las herramientas necesarias para realizar el servicio, así como disponer la retirada de los repuestos. Las solicitudes de Herramientas Especiales deben ser monitoreadas con al menos dos días de anticipación, evitando así caídas en Productividad / Eficiencia motivadas por la coincidencia de fechas / turnos, donde los Técnicos de Campo y Taller necesitan la misma herramienta en la misma fecha / turno.",
                    "comoEvaluar": "Verifique con el Gerente de Repuestos si y cómo se hacen las solicitudes de repuestos y herramientas.\r\nCompruebe si existe un método de control de herramientas especiales eficaz para evitar que diferentes técnicos soliciten el mismo artículo en la misma fecha / turno."
                  }
                }
              },
              "ET.5": {
                "id": "ET.5",
                "descripcion": "Ejecución del Servicio Aprobado",
                "requisitos": {
                  "EO.5.1": {
                    "id": "EO.5.1",
                    "pilarId": "ET",
                    "estandarId": "ET.5",
                    "requerimientoOperacional": "El técnico debe:\r\na) Utilizar el EPP adecuado para realizar el servicio: gafas de seguridad, guante (químico o físico), protección auditiva y calzado de seguridad el 100% del tiempo en el taller y, y cuando aplicable caso: mono, máscara y cinturón de seguridad;\r\nb) Ejecutar el servicio de acuerdo con el Manual Técnico disponible en Service ADVISOR ™ y, si es necesario, abrir DTAC;\r\nc) Informar al Auxiliar del Servicio Administrativo sobre la evolución del servicio: al menos 03 pasos: 1) el inicio del servicio; 2) la conclusión del diagnóstico / presupuesto; y 3) el trabajo terminado;\r\nd) Si existen servicios adicionales, verificar la disponibilidad de repuestos e informar al Asistente del Servicio Administrativo para que se comunique con el Cliente, solicitando aprobación para la ejecución del servicio adicional;\r\ne) En caso de indisponibilidad de repuestos, informar al Auxiliar Administrativo, solicitándole que coloque la OS en el bin/contenedor correspondiente (Trabajo Paralizado) y actualice el sistema;\r\nf) Después de completar el servicio, completar la OS en detalle, informando los servicios realizados y los repuestos reemplazados, además del tiempo empleado en cada etapa;\r\ng) Adjunte a la OS todos los documentos relevantes para el servicio realizado (OS, Informe de servicio, Lista de verificación de inspección visual, Formulario de garantía, si lo hubiera, Lista / Presupuesto de repuestos utilizados y Lista de verificación de revisión de la máquina) y deposítelos en el contenedor \"OS cerradas\" inmediatamente. Informar al Asistente de Servicios Administrativos sobre el servicio terminado;\r\nh) Anotar el tiempo dedicado a cada actividad realizada, incluida la preparación de la máquina, el diagnóstico y la ejecución del servicio;",
                    "comoEvaluar": "a) Verificar, en varios momentos durante la implementación, el uso correcto de EPPs por parte de los Técnicos y si cumplen con los requisitos de la norma.\nb) Verificar si el servicio se realiza según el Manual Técnico disponible en Service ADVISOR ™ y, si es necesario, si el Técnico ha abierto el DTAC.\nc) Verificar la evidencia de la información de las 3 etapas al Asistente del Servicio Administrativo en al menos 5 OS cerradas y en 3 OS abiertas en etapas avanzadas de los servicios.\nd) Verificar en 05 OS completadas que presentaron la necesidad de realizar servicios adicionales la evidencia de contacto con el Cliente y si existe un registro formal de su aprobación.\ne) Verificar que la información relacionada con la interrupción del servicio fue pasada al Asistente Administrativo y que asignó inmediatamente la OS al bin/contenedor \"Trabajo Paralizado\", actualizando también el sistema puntualmente.\nf) Verificar las 05 OS analizadas si toda la información solicitada en (f) fue informada correctamente en sus respectivos campos del Informe de Ejecución del Servicio.\ng) Verifique el bin/contenedor de “OS cerradas” (físico o electrónico) si, junto con todos las OS, están los informes de ejecución del servicio, las listas de verificación de inspección visual, los formularios de garantía, si corresponde, la lista / presupuesto de los repuestos utilizados y la lista de verificación de revisión de la máquina. ). Verifique el procedimiento de información entre el técnico y el AA con respecto a las OS's que se han cerrado.\nh) Observar en los campos destinados al registro de horas si el Técnico discrimina el tiempo necesario para realizar las diferentes etapas del servicio o comprobar en el sistema si hubo el registro."
                  }
                }
              },
              "ET.6": {
                "id": "ET.6",
                "descripcion": "Entrega y Cierre",
                "requisitos": {
                  "EO.6.1": {
                    "id": "EO.6.1",
                    "pilarId": "ET",
                    "estandarId": "ET.6",
                    "requerimientoOperacional": "El Asistente Administrativo de Servicios debe:\r\na) Verificar el correcto relleno de todos los campos del Informe de Ejecución del Servicio y la OS y, si se requiere algún ajuste, devolverlo al Técnico para su corrección;\r\nb) Actualizar el sistema con la información de la OS;\r\nc) Informar al Cliente sobre la terminación del Servicio;\r\nd) Informar al Cliente:\r\n   - Servicios desempeñados;\r\n   - Repuestos reemplazados;\r\n   - Valor final del servicio;\r\ne) Tratar las dudas u objeciones del Cliente con respecto al servicio prestado;\r\nf) acordar con el cliente cómo devolver la máquina;\r\ng) Cierre la OS y proceda con los procesos de facturación.",
                    "comoEvaluar": "a) Verificar en el sistema de Gestión del Concesionario que se haya registrado la información contenida en la OS y en los Informes de Ejecución del Servicio.\nb, c, d) Verificar que la actualización del sistema se realice con las informaciones de la OS. Cuando sea posible, verificar in loco la explicación del servicio prestado al Cliente por el Asistente Administrativo y verificar que cumple con todos los requisitos de (c) y ( d).\ne) Verificar in loco, en caso de dudas y / u objeciones, si el Asistente Administrativo está preparado para el trato. Dé algunos ejemplos de objeciones y / o dudas y pregunte al Asistente Administrativo cómo resolverlas. Verifique si se solicita formalización de aprobación.\nf, g) Verificar como es acordado la devolución de las maquinas con los Clientes y que los trámites de cierre de la OS's y envío de los datos para facturación se realicen inmediatamente después del cierre de la Orden de Servicio en el sistema."
                  },
                  "EO.6.2": {
                    "id": "EO.6.2",
                    "pilarId": "ET",
                    "estandarId": "ET.6",
                    "requerimientoOperacional": "El Responsable por la Entrega de la Máquina debe completar la Lista de Verificación de Inspección Visual en el momento de Recogida o Entrega de la Máquina y solicitar al Cliente o Responsable de la misma que firme y complete la fecha de entrega, tanto en la OS como en la Lista de Verificación de Inspección Visual.",
                    "comoEvaluar": "Siempre que sea posible, acompañe una entrega y verifique si la Lista de Verificación de Inspección Visual se aplica al Cliente o Persona a cargo que retirará la máquina y si se le solicita que firme y complete la fecha de entrega.\r\nVerifique en las 05 OS analizadas si la Lista de Verificación se adjunta, completamente llenada con fecha y firma."
                  }
                }
              }
            }
          },
          "ER": {
            "id": "ER",
            "nombre": "Ejecución de Servicio Remoto",
            "estandares": {
              "ER.1": {
                "id": "ER.1",
                "descripcion": "Apertura del \r\nAtendimiento",
                "requisitos": {
                  "ER.1.1": {
                    "id": "ER.1.1",
                    "pilarId": "ER",
                    "estandarId": "ER.1",
                    "requerimientoOperacional": "Dependiendo de la frecuencia de la teleasistencia, el tamaño del Concesionario y el nivel de conocimiento del equipo de Técnicos, al menos un profesional deberá ser designado formalmente como Responsable por la Asistencia Remota del Concesionario o incluso del Grupo;\r\nEl Responsable de la Asistencia Remota debe tener suficiente experiencia y formación técnica para comprender un problema técnico y proponer soluciones de forma remota.",
                    "comoEvaluar": "Verificar la existencia de uno o más profesionales capacitados y responsables del Servicio Remoto y si la estructura del servicio soporta la demanda."
                  },
                  "ER.1.2": {
                    "id": "ER.1.2",
                    "pilarId": "ER",
                    "estandarId": "ER.1",
                    "requerimientoOperacional": "Seguimiento de 2 llamadas. Verifique que se responda la llamada telefónica hasta el tercer timbre y que la operadora remota siga el guión estándar. También verifique si la información descrita en el requisito es recopilada y / o confirmada. Analizar la calidad de la información y la efectividad de las soluciones propuestas;\r\nSi el monitoreo no es posible, entreviste a la persona responsable de la asistencia remota para identificar si conoce y practica el requisito estándar. Solicitar 05 SO para llamadas remotas realizadas en los últimos 30 días, relacionadas con los Clientes del Concesionario, y verificar la calidad de la información y la efectividad de las soluciones propuestas.",
                    "comoEvaluar": "Seguimiento de 2 llamadas. Verifique que se responda la llamada telefónica hasta el tercer timbre y que el responsable por la asistencia remota siga el guión estándar. También verifique si la información descrita en el requisito es recopilada y / o confirmada. Analizar la calidad de la información y la efectividad de las soluciones propuestas;\r\nSi el monitoreo no es posible, entreviste a la persona responsable de la asistencia remota para identificar si conoce y practica el requisito estándar. Solicitar 05 SO para llamadas remotas realizadas en los últimos 30 días, relacionadas con los Clientes de la Concesionaria, y verificar la calidad de la información y la efectividad de las soluciones propuestas."
                  },
                  "ER.1.3": {
                    "id": "ER.1.3",
                    "pilarId": "ER",
                    "estandarId": "ER.1",
                    "requerimientoOperacional": "Los datos recopilados deben registrarse en el sistema y se debe informar al Cliente si el servicio se puede realizar en el estándar remoto. Si existe una Política Comercial definida para Servicio Remoto, el responsable deberá informar al Cliente de las condiciones, antes de proceder con el servicio.\r\n- De preferencia por un servicio presencial, el asistente debe coordinar la programación de la cita, remitiendo los datos al Responsable de los Servicios de Programación;\r\n- En caso de que el Cliente acepte las condiciones definidas por la Política Comercial de Servicio Remoto, el asistente deberá comenzar aplicando el Menú de Síntomas.",
                    "comoEvaluar": "Verificar en las Asistencias acompañadas y en las 5 OS analizadas si:\r\n1) Las solicitudes de los clientes se registran en el sistema.\r\n2) el asistente informó al cliente de las condiciones comerciales para proceder con el servicio;\r\n3) cuando el Cliente elige el servicio presencial, el asistente recopila los datos necesarios para ser enviados a la Persona Responsable por la Programación y Apuntamiento de Servicios; y\r\n4) si el Cliente acepta continuar el servicio remoto después de recibir las condiciones comerciales, el asistente sigue los estándares del servicio."
                  },
                  "ER.1.4": {
                    "id": "ER.1.4",
                    "pilarId": "ER",
                    "estandarId": "ER.1",
                    "requerimientoOperacional": "Aplicar el Menú de Síntomas y registrar en detalle todas las solicitudes del Cliente en el sistema, utilizando los términos exactos utilizados por él.",
                    "comoEvaluar": "Verificar en las Asistencias acompañadas y en las 5 OS analizadas para evidencia de la aplicación del Menú de Síntomas creado por el Concesionario. Analizar, en la descripción de \"Voz del Cliente\", si los registros utilizan los términos exactos utilizados por él."
                  }
                }
              },
              "ER.2": {
                "id": "ER.2",
                "descripcion": "Diagnóstico Remoto",
                "requisitos": {
                  "ER.2.1": {
                    "id": "ER.2.1",
                    "pilarId": "ER",
                    "estandarId": "ER.2",
                    "requerimientoOperacional": "Con la información relativa a la máquina en servicio transmitida por el Cliente y registrada en el Menú de Síntomas, el Responsable del Servicio Remoto debe:\r\na) Verificar la información proporcionada por el Cliente;\r\nb) Realice el diagnóstico siguiendo los “7 pasos de diagnóstico”;\r\nc) Utilizar Service ADVISOR ™, DTAC y DTAC Solutions y otras herramientas disponibles para diagnóstico remoto;\r\nd) Entregar un diagnóstico más rápido y asertivo cuando la solución es inmediata;\r\ne) Cuando la solución no sea inmediata, por cualquier necesidad de consulta existente, informar al Cliente del trámite y acordar el plazo de devolución;\r\nf) Asegurarse de la información proporcionada por el Cliente, relacionando los síntomas reportados con los posibles problemas encontrados y confirmar el diagnóstico;\r\ng) Registrar en detalle las respuestas a las preguntas formuladas durante el diagnóstico y la confirmación del diagnóstico en el sistema.",
                    "comoEvaluar": "a) Verificar in loco, siempre que sea posible, si el Técnico Responsable del Servicio Remoto verifica la información proporcionada por el Cliente.\r\nSi no es posible el monitoreo in loco, entreviste al técnico responsable de la asistencia remota y verifique el procedimiento para verificar la información pasada.\nb) Verifique in loco si el Técnico Responsable por la Asistencia Remota realiza el diagnóstico utilizando los \"7 Pasos de Diagnóstico\".\r\nSi no es posible realizar un seguimiento in loco, entreviste al técnico responsable de la asistencia remota y compruebe si conoce y aplica el procedimiento.\nc) Verificar in loco si el técnico responsable por la asistencia remota utiliza el Service Advisor, DTAC y Soluciones DTAC para ayudar en el diagnóstico.\r\nSi el monitoreo in loco no es imposible, entrevista al Técnico Responsable por la Asistencia Remota y verifica si utiliza las herramientas mencionadas.\nd,e,f) Verificar in loco si el Técnico Responsable por la Asistencia Remota, utilizando la información proporcionada por el Cliente, relaciona los síntomas reportados con los posibles problemas encontrados y entrega el diagnóstico / plazo de consenso para la devolución.\r\nSi no es posible el monitoreo in loco, entreviste al técnico responsable del servicio remoto y verifique el cumplimiento de los procedimientos anteriores.\ng) Verificar que el sistema registró las respuestas a las preguntas formuladas durante el diagnóstico y la confirmación del Diagnóstico.\r\nEn las 05 OS's analizadas, verificar si los registros mencionados anteriormente fueron realizados en el sistema del Concesionario."
                  }
                }
              },
              "ER.3": {
                "id": "ER.3",
                "descripcion": "Procedimientos de Orientación",
                "requisitos": {
                  "ER.3.1": {
                    "id": "ER.3.1",
                    "pilarId": "ER",
                    "estandarId": "ER.3",
                    "requerimientoOperacional": "El Técnico Responsable del Servicio Remoto debe:\r\na) De acuerdo con el diagnóstico realizado y la información recopilada, utilizar la información de orientación de ejecución del servicio contenida en Service ADVISOR ™ y DTAC para orientar al Cliente sobre cómo resolver el problema diagnosticado;\r\nb) Transmitir esta información al Cliente, de manera pausada y siempre asegurándose de que está comprendiendo y ejecutando la información pasada;\r\nc) Solicitar al Cliente que realice pruebas para asegurarse de que se resuelve la solución al problema presentado y el correcto funcionamiento de la máquina;\r\nd) Registre la información de la solución (pautas anteriores y pruebas realizadas) en el sistema.",
                    "comoEvaluar": "a) Verificar in loco si el Técnico Responsable por la Asistencia Remota, con la información planteada en el diagnóstico, utiliza la información y las pautas de ejecución del servicio contenidas en el Service ADVISOR ™ y DTAC para orientar al Cliente en la resolución del problema diagnosticado.\r\nSi no es posible realizar un seguimiento in loco, entreviste al técnico responsable de la asistencia remota y compruebe el procedimiento descrito anteriormente.\nb) Verificar in loco si el Técnico Responsable por la Asistencia Remota transmite esta información al Cliente, de acuerdo con el requisito estándar, y se asegura de que comprende y ejecuta las instrucciones que se le dan.\r\nSi no es posible realizar un seguimiento in loco, entreviste al técnico responsable por la Asistencia Remota y compruebe el cumplimiento del procedimiento anterior.\nc) Verificar in loco si el Técnico Responsable del Servicio Remoto solicita al Cliente que realice pruebas para asegurarse de la solución del problema presentado y el correcto funcionamiento de la máquina.\nd) Verificar en el sistema del Concesionario que se haya registrado toda la información relativa a las soluciones pasadas y pruebas realizadas, así como el resultado del servicio.\r\nEn los 05 OS's analizadas, asegúrese de estos registros en el sistema."
                  }
                }
              },
              "ER.4": {
                "id": "ER.4",
                "descripcion": "Cierre",
                "requisitos": {
                  "ER.4.1": {
                    "id": "ER.4.1",
                    "pilarId": "ER",
                    "estandarId": "ER.4",
                    "requerimientoOperacional": "El Técnico Responsable del Servicio Remoto debe:\r\na) Si el Cliente informa que el problema está resuelto, asegúrese de que se haya abordado en su totalidad y de que se hayan eliminado todas las preguntas e inquietudes del Cliente. Asegúrese de que pueda ayudarlo con algo más. Continuar con la prospección de oportunidades, cuando corresponda (ER.5);\r\nb) Si el problema no ha sido resuelto y es necesario asistir en persona, reenvíe la llamada al Responsable de Programación y Apuntamiento y solicite que programe con el Cliente la mejor fecha para la ejecución del servicio;\r\nc) Concluir el contacto con el Cliente y registrar los resultados obtenidos en el Sistema;\r\nd) Cerrar el servicio;",
                    "comoEvaluar": "a) Observar, en las atenciones acompañadas, si el problema ha sido resuelto, si el Técnico Responsable por la Asistencia Remota se asegura de que el problema está totalmente resuelto y que se eliminan todas las dudas e inquietudes por parte del Cliente. Verifique si el empleado está disponible para ayudar al Cliente en algo más y busca identificar oportunidades de prospección.\nb) Observar, si el problema no ha sido resuelto, si el Técnico Responsable informa al Cliente del procedimiento de programación.\r\nObservar si se solicita la asistencia presencial del encargado de programación.\r\nPregunte al responsable de programación cómo se llevan a cabo estos trámites.\r\nConsultar en la Agenda de Programación si existen casos de asistencia presencial apuntados desde la asistencia remota y comprobar la consistencia de las fechas previstas.\nc) Verificar en el sistema del Concesionario si se registraron los resultados obtenidos.\r\nEn las 5 OS analizadas, asegúrese de los registros en el sistema.\nd) Consulte con el Asistente Administrativo cómo llevar a cabo el procedimiento para cerrar las OS's."
                  }
                }
              },
              "ER.5": {
                "id": "ER.5",
                "descripcion": "Oportunidad de Prospección",
                "requisitos": {
                  "ER.5.1": {
                    "id": "ER.5.1",
                    "pilarId": "ER",
                    "estandarId": "ER.5",
                    "requerimientoOperacional": "El Técnico Responsable del Servicio Remoto debe:\r\na) Cuestionar al Cliente sobre otras máquinas / equipos de su propiedad y sondear la existencia de alguna oportunidad para vender nuevos servicios;\r\nb) Si el Cliente manifiesta tener otro equipo que necesita mantenimiento, proceda con la apertura de un nuevo servicio. Aplicar el Menú de Síntomas para las respectivas máquinas / equipos, establecer un diagnóstico y, si es posible, aprobar un presupuesto, registrando en el sistema toda la información relevante para el nuevo servicio.\r\nc) Si existe alguna Campaña vigente que atienda las máquinas / equipos del Cliente, aprovechar para ofrecerla al Cliente, explicando la composición de la oferta y las condiciones comerciales, buscando realizar la venta;\r\nd) Agradecer el contacto en nombre del Concesionario y despedirse del Cliente.\r\ne) Remitir la documentación para facturación, cuando aplicable.",
                    "comoEvaluar": "a) Observar si el Responsable del Servicio Remoto consulta el sistema y / o pregunta al Cliente si tiene otras máquinas / equipos.\r\nSi es imposible dar seguimiento, pregunte al técnico responsable sobre el procedimiento de prospección.\nb) Consultar con el Técnico Responsable por la Asistencia Remota si, si se identifica alguna oportunidad de vender nuevos servicios, se abre un nuevo servicio, se aplica el Menú de Síntomas, se presenta el diagnóstico y, si es posible, se comunica un presupuesto.\r\nVerifique que toda la información pertinente al nuevo servicio esté registrada en el sistema.\r\nVerificar si, en los 05 OS's analizadas, se realizaron los registros, en su caso.\nc) Verificar si el Técnico Responsable por la Asistencia Remota tiene conocimiento de las campañas vigentes en el período y si las ofrece a los clientes atendidos, cuando aplicable.\nd, e) Verificar que el Técnico Responsable por la Asistencia Remota agradece el contacto según el requisito, se despide formalmente y procede con el reenvío de los montos para facturación, cuando aplicable."
                  }
                }
              }
            }
          },
          "SA": {
            "id": "SA",
            "nombre": "Soporte Administrativo",
            "estandares": {
              "SA.1": {
                "id": "SA.1",
                "descripcion": "Procedimientos de Garantía",
                "requisitos": {
                  "SA.1.1": {
                    "id": "SA.1.1",
                    "pilarId": "SA",
                    "estandarId": "SA.1",
                    "requerimientoOperacional": "El Concesionario debe contar con una persona responsable de centralizar el Proceso de Garantía en la tienda o en el Grupo.",
                    "comoEvaluar": "Consultar quien es el responsable por la Garantía en el taller o grupo."
                  },
                  "SA.1.2": {
                    "id": "SA.1.2",
                    "pilarId": "SA",
                    "estandarId": "SA.1",
                    "requerimientoOperacional": "La persona responsable por los Procesos de Garantía debe seguir las recomendaciones del Manual de Gestión de la Garantía, evitando así inconsistencias y plazos incumplidos estipulados por John Deere.",
                    "comoEvaluar": "Pregunte al profesional cómo realiza los procesos y evalúe si conoce suficientemente los procedimientos de Garantía."
                  },
                  "SA.1.3": {
                    "id": "SA.1.3",
                    "pilarId": "SA",
                    "estandarId": "SA.1",
                    "requerimientoOperacional": "El Asistente Administrativo de Servicio  debe:\r\n- Al abrir un proceso de Garantía, asegurarse de que se publique la entrada correcta de las horas trabajadas; y\r\n- Empacar, identificar y empaquetar las piezas utilizadas en los procesos realizados en la Sala de Garantía, hasta que llegue formalmente la autorización formal del descarte emitida por TCSM.",
                    "comoEvaluar": "Solicite al Administrador de Servicio, responsable del proceso de Garantía, 2 OS's de procesos cerrados y verifique que las piezas estén debidamente embaladas, etiquetadas y embaladas en la Sala de Garantía."
                  },
                  "SA.1.4": {
                    "id": "SA.1.4",
                    "pilarId": "SA",
                    "estandarId": "SA.1",
                    "requerimientoOperacional": "El Responsable por la Administración de Garantía debe:\r\n- Organizar y recopilar la información del proceso y, en caso de ser necesario, solicitar información adicional al Técnico responsable de realizar el servicio, Jefe de Servicio o Asistente Administrativo.\r\n- Enviar los procesos a través del Portal John Deere y registrar las fechas de los envíos en el Sistema, monitoreando el avance del proceso con JD.\r\n- Si se aprueba el proceso, informar al Gerente de Servicio y controlar los pagos de cada proceso.\r\n- Si el proceso es denegado, informe al Gerente del Servicio el motivo del rechazo.",
                    "comoEvaluar": "Solicitar al responsable por los Procesos de Garantía, 2 procesos finalizados y enviados a través del portal John Deere y verificar que su estado no sea rechazado definitivamente.\r\nSolicite el control del avance de los procesos de Garantía con John Deere y verifique el índice de aprobación de los procesos enviados en los últimos 12 meses."
                  },
                  "SA.1.5": {
                    "id": "SA.1.5",
                    "pilarId": "SA",
                    "estandarId": "SA.1",
                    "requerimientoOperacional": "El Asistente Administrativo de Servicio deberá ponerse en contacto con el Cliente e informarle de la negativa del JD al proceso pertinente a su máquina, proceder a la facturación de los montos involucrados y a el adecuado descarte de los repuestos involucrados.",
                    "comoEvaluar": "Solicitar al Responsable por el Proceso de Garantía, 2 procesos rechazados por John Deere y compruebe los motivos del rechazo y si los responsables (Garantía y Gerente de Servicio) han tomado medidas para evitar reincidencias."
                  },
                  "SA.1.6": {
                    "id": "SA.1.6",
                    "pilarId": "SA",
                    "estandarId": "SA.1",
                    "requerimientoOperacional": "El Gerente de Servicio o Postventa debe capacitar a todo el equipo del Departamento de Servicio en los Procedimientos de Garantía, enfocándose en la importancia de cada una de las partes involucradas para que los procesos se realicen correctamente.",
                    "comoEvaluar": "Interrogar al Gerente de Servicio sobre cómo califica a su equipo en los Procedimientos de Garantía y cómo le comunica al equipo las responsabilidades de cada miembro en el procedimiento correcto en los procesos enviados para consideración de JD. Pregunta 2 Administradores de Servicio y 2 Técnicos sobre cuánto saben sobre los procesos de Garantía."
                  }
                }
              },
              "SA.2": {
                "id": "SA.2",
                "descripcion": "Procedimientos de \r\nPMP",
                "requisitos": {
                  "SA.1.7": {
                    "id": "SA.1.7",
                    "pilarId": "SA",
                    "estandarId": "SA.2",
                    "requerimientoOperacional": "La Persona Responsable por la Gestión de los Procesos PMP debe seguir lo recomendado en el Manual de Gestión de Garantía, evitando así inconsistencias y incumpliendo los plazos estipulados por John Deere.",
                    "comoEvaluar": "Pregunte al profesional cómo realiza los procesos y evalúe si conoce suficientemente los procedimientos de PMP's."
                  },
                  "SA.1.8": {
                    "id": "SA.1.8",
                    "pilarId": "SA",
                    "estandarId": "SA.2",
                    "requerimientoOperacional": "El Responsable por Programación, con base en el informe del PMP abierto, debe programar y apuntar la ejecución de los servicios de acuerdo a los repuestos disponibles, registrarlas en el sistema e informar al Responsable de Administración del PMP;",
                    "comoEvaluar": "Compruebe si los PMP extraídos del portal John Deere en la última semana están programados en el Cuadro de Programación. También verifique evidencias de confirmación de la Programación y Apuntamiento con los Clientes involucrados y la disponibilidad de repuestos para la ejecución de los servicios programados."
                  },
                  "SA.1.9": {
                    "id": "SA.1.9",
                    "pilarId": "SA",
                    "estandarId": "SA.2",
                    "requerimientoOperacional": "El Responsable por la Administración del PMP debe recibir los Informes de Ejecución del Servicio / OS completados por los Técnicos del PMP y los Documentos de Ejecución del Servicio firmados por los Clientes, cerrar las OS y remitir los procesos a John Deere.",
                    "comoEvaluar": "Solicite 2 OSs de ejecución PMP y verifique la existencia de las firmas de los Clientes."
                  },
                  "SA.1.10": {
                    "id": "SA.1.10",
                    "pilarId": "SA",
                    "estandarId": "SA.2",
                    "requerimientoOperacional": "El Responsable por la Administración del PMP debe monitorear los procesos enviados y, una vez identificado el pago, archivar la OS.",
                    "comoEvaluar": "Consultar en las mismas 2 OS's si los procesos pasaron a facturación en un plazo satisfactorio (hasta 5 días hábiles)"
                  }
                }
              }
            }
          },
          "SP": {
            "id": "SP",
            "nombre": "Seguimiento Post-Servicio",
            "estandares": {
              "AP.1": {
                "id": "AP.1",
                "descripcion": "Estructuración de la Encuesta de Satisfacción",
                "requisitos": {
                  "AP.1.1": {
                    "id": "AP.1.1",
                    "pilarId": "SP",
                    "estandarId": "AP.1",
                    "requerimientoOperacional": "Para estructurar la investigación se debe definir lo siguiente:\r\na) El objetivo y propósitos de la Investigación (Ej.: Investigará solo la satisfacción o paso a paso del Proceso);\r\nb) El muestreo a utilizar, considerando un mínimo del 80% de los Clientes en intentos de contactar a los OS atendidos en el período;\r\nc) Medios utilizados para la investigación (medios telefónicos o electrónicos);\r\nd) La hora de la encuesta, teniendo en cuenta el plazo máximo de 7 días hábiles posteriores a la finalización del servicio cuando se trata de un contacto telefónico; y 2 días hábiles cuando se utilicen medios electrónicos;\r\ne) El responsable por la realización de la investigación (interna o de terceros).\r\nf) Si la encuesta es telefónica, un script para la realización de una entrevista contemplando la apertura, las preguntas a utilizar por el Responsable de Contacto con el Cliente y el cierre.\r\ng) La encuesta debe permitir una percepción clara del nivel de satisfacción del cliente e identificar insatisfacciones;\r\nh) La escala que se utilizará (Ej .: puntuación de 1 a 10 o SÍ o NO) para cada ítem;\r\ni) La forma de consolidar los resultados y medios de difusión de la investigación dentro del Concesionario.",
                    "comoEvaluar": "a,c,d) Solicitar evidencias de formalización del Procedimiento de Investigación del Concesionario. Verificar si contienen los objetivos, la finalidad de la investigación, los medios a utilizar, la periodicidad de la investigación, teniendo en cuenta el plazo máximo de 07 días hábiles para realizar la investigación y la escala a utilizar.\nb) Solicite 10 OS's cerradas en el período de los últimos 30 días y compruebe si las búsquedas se realizaron para al menos el 80% de estas OS's.\ne) Verificar en el Procedimiento de Investigación del Concesionario si se define el responsable por realizar la investigación, ya sea internamente o por terceros, y si se está siguiendo dicho procedimiento.\nf,g,h) Verificar en el Procedimiento de Investigación del Concesionario si contiene un guión para realizar la entrevista (si se realiza vía telefónica), si es posible identificar insatisfacciones y si existe una definición de escala para cada pregunta.\ni) Verificar si en el Procedimiento de Investigación del Concesionario se define la forma de consolidación de resultados y la forma de divulgarlos.\r\nVerificar si existe un sistema o procedimiento efectivo de consolidación de resultados, la forma de divulgación de los resultados a todos los empleados del Concesionario y si se está siguiendo la forma de divulgación recomendada en el Procedimiento."
                  },
                  "AP.1.2": {
                    "id": "AP.1.2",
                    "pilarId": "SP",
                    "estandarId": "AP.1",
                    "requerimientoOperacional": "El procedimiento establecido para la realización de la Encuesta de Satisfacción debe ser formalizado, aprobado y firmado por el GGN / COO del Grupo. El procedimiento debe ser divulgado a todos los empleados involucrados en la prestación de servicios, asegurando una comprensión completa de su contenido entre los miembros del equipo.",
                    "comoEvaluar": "Verifique si el Procedimiento de Investigación Oficial del Concesionario está formalizado, divulgado y firmado por el GGN / COO del Grupo. Pregunta 02 Empleados para ver si conocen el procedimiento y el lugar de publicación de los resultados, además del desempeño de los principales KPIs en la Encuesta de Satisfacción (Consultor Prime y GGN / COO deben definir cuáles serán los principales KPIs de la casa para ser auditado)"
                  },
                  "AP.1.3": {
                    "id": "AP.1.3",
                    "pilarId": "SP",
                    "estandarId": "AP.1",
                    "requerimientoOperacional": "Entrenar los Responsables por las encuestas.",
                    "comoEvaluar": "Solicitar al Gerente de Servicio o Postventa evidencia de la capacitación y seguimiento de la (s) persona (s) responsable (s) por la Investigación."
                  },
                  "AP.1.4": {
                    "id": "AP.1.4",
                    "pilarId": "SP",
                    "estandarId": "AP.1",
                    "requerimientoOperacional": "En el caso de que la Encuesta de Satisfacción del Cliente sea realizada por una empresa subcontratada, el Gerente de Servicio o Postventa deberá transmitir la información necesaria para la aplicación de las encuestas.",
                    "comoEvaluar": "Para una investigación realizada por un tercero, consultar con la empresa subcontratada si el profesional responsable por realizar la investigación conoce y cuenta con el Procedimiento formalizado y si la información le fue entregada por el Concesionario en tiempo (7 días para llamadas telefónicas o 2 días para uso de plataformas digitales)."
                  },
                  "AP.1.5": {
                    "id": "AP.1.5",
                    "pilarId": "SP",
                    "estandarId": "AP.1",
                    "requerimientoOperacional": "La persona responsable de realizar la encuesta NO debe ser del Departamento de Servicios, con el fin de evitar limitaciones e inhibiciones de los Clientes a la hora de responder a la encuesta.",
                    "comoEvaluar": "Verificar, en el caso de una encuesta realizada por un empleado del Concesionario, que el responsable de realizar la Encuesta no pertenece al departamento de Servicios."
                  },
                  "AP.1.6": {
                    "id": "AP.1.6",
                    "pilarId": "SP",
                    "estandarId": "AP.1",
                    "requerimientoOperacional": "En caso de que exista más de una OS con servicios completados en un período determinado para el mismo Cliente, realice solo 1 llamada al Cliente en un período máximo de 7 días hábiles después de la finalización del servicio.",
                    "comoEvaluar": "Verifique cómo se manejan las encuestas para los Clientes donde 02 o más Técnicos prestaron servicios para el mismo Cliente dentro del mismo período. Comprueba si SÓLO se ha realizado UN contacto y si se ha cumplido el plazo de 07 días laborables (o 2 para el uso de plataformas digitales)."
                  }
                }
              },
              "AP.2": {
                "id": "AP.2",
                "descripcion": "Encuesta por \r\nTeléfono",
                "requisitos": {
                  "AP.2.1": {
                    "id": "AP.2.1",
                    "pilarId": "SP",
                    "estandarId": "AP.2",
                    "requerimientoOperacional": "Al llamar a un cliente, la persona de contacto debe:\r\na) Establecer contacto con el Cliente en un plazo máximo de 7 días hábiles posteriores a la finalización del servicio;\r\nb) Siga el script desarrollado en el concesionario:\r\n- Explique, en el enfoque inicial, cuál es el propósito del contacto: \"Evaluar la satisfacción del cliente con la última experiencia de posventa en el concesionario\".\r\n- Realizar las distintas preguntas, registrando tanto la valoración de la satisfacción como la verbalización de las insatisfacciones, si las manifiestan los Clientes;\r\n- Agradecer al Cliente el tiempo disponible, ya sea mediante respuesta telefónica o electrónica (SMS, WhatsApp o correo electrónico).\r\nc) Reprogramar el contacto dentro de 2 días hábiles, si la llamada no es exitosa;\r\nd) Registrar la información recoletada en el Sistema del Concesionario o Control específico (Clientes contactados, resultados obtenidos, verbalizaciones ...);\r\ne) Si se detecta alguna insatisfacción, registrar la verbalización de la insatisfacción del Cliente en el sistema o control específico e Informar al Gerente de Servicio o Postventa (AP.3);",
                    "comoEvaluar": "a) Solicite 10 OS's cerradas en un plazo de tres meses. En las 10 OS solicitadas, verificar que el período entre las fechas de finalización del servicio realizado y la realización de la encuesta no supere el período de 07 días hábiles.\nb) Monitorear la realización de 02 encuestas y analizar si el responsable por las entrevistas está preparado para su ejecución.\r\nSi no es posible hacer un seguimiento in loco, verifique si hay grabaciones o simule un servicio con el responsable por la investigación.\nc) Revisar el procedimiento de reprogramación de llamadas fallidas y verificar que cumplan con el plazo máximo de 2 días hábiles.\nd) Solicita los registros de la información recopilada y comprueba si están actualizados.\r\nPara las 10 OS's analizadas, verifique el input correcto de los registros.\ne) Solicitar, para 2 casos de insatisfacción ocurridos en los últimos 30 días, la evidencia de los registros de insatisfacciones y las respectivas comunicaciones al Gerente de Servicio o Postventa."
                  }
                }
              },
              "AP.3": {
                "id": "AP.3",
                "descripcion": "Encuesta por Aplicativos y Sistemas",
                "requisitos": {
                  "AP.3.1": {
                    "id": "AP.3.1",
                    "pilarId": "SP",
                    "estandarId": "AP.3",
                    "requerimientoOperacional": "Al contactar a un Cliente por medios electrónicos (WhatsApp, correo electrónico, plataformas, etc.), el responsable del contacto debe:\r\na) Establecer contacto con el Cliente en un plazo máximo de 2 días hábiles posteriores a la finalización del servicio;\r\nb) Especificar a qué servicio se refiere la investigación, informando al menos la fecha, máquina, técnico y servicio realizado;\r\nc) Dejar un espacio para que el Cliente escriba sus observaciones;\r\nd) Reenviar la encuesta dentro de los 2 días hábiles, si no tiene éxito en el intento anterior;\r\ne) Registrar la información recopilada en el Sistema del Concesionario o Control específico (Clientes contactados, resultados obtenidos, verbalizaciones);\r\nf) Si se detecta algún tipo de insatisfacción, registrar la verbalización de la insatisfacción del Cliente en el sistema o control específico e Informar al Gerente de Servicio o Postventa (AP.3);",
                    "comoEvaluar": "a) En las 10 OS solicitadas previamente, verificar que el período entre la fecha de finalización del servicio realizado y la fecha de la encuesta no exceda el período de 02 días hábiles.\nb,c) Verificar la estructura de investigación y si cumple con los requisitos \"b\" y \"c\" del AP.3.1\nd) Consultar el procedimiento de reenvío para los casos que no pudieron contactar y verificar que se cumpla el plazo de 2 días hábiles.\ne) Solicitar los registros de la información recopilada y verificar si están actualizados.\r\nPara los 10 OS's analizadas, verifique los registros.\nf) Solicitar, para 2 casos de insatisfacción ocurridos en los últimos 30 días, evidencias de los registros de insatisfacciones y comunicaciones al Gerente de Servicio o Postventa."
                  }
                }
              },
              "AP.4": {
                "id": "AP.4",
                "descripcion": "Tratativa de las Insatisfacciones",
                "requisitos": {
                  "AP.4.1": {
                    "id": "AP.4.1",
                    "pilarId": "SP",
                    "estandarId": "AP.4",
                    "requerimientoOperacional": "Cuando se identifica una insatisfacción del Cliente, el Empleado Responsable del contacto debe registrar la insatisfacción e informarla formal e inmediatamente al Gerente de Servicio o Postventa.",
                    "comoEvaluar": "Solicitar el registro de los casos de insatisfacción manifestados por el Cliente a través de los diferentes canales en los últimos 30 días y las evidencias de envío de la información al Gerente de Servicios o Postventa. Si no hubo insatisfacciones en ese período, solicítelo de períodos anteriores."
                  },
                  "AP.4.2": {
                    "id": "AP.4.2",
                    "pilarId": "SP",
                    "estandarId": "AP.4",
                    "requerimientoOperacional": "En base a la insatisfacción, el Gerente de Servicio o Postventa deberá involucrar a los empleados responsables de la ejecución del servicio y verificar el historial de asistencia pertinente a la insatisfacción, registrando en un sistema específico o controle propio con la información obtenida.",
                    "comoEvaluar": "Verificar, para los casos de insatisfacción en el ítem anterior, si los responsables estuvieron involucrados en buscar la solución de las insatisfacciones reportadas y si existe evidencia de la información obtenida."
                  },
                  "AP.4.3": {
                    "id": "AP.4.3",
                    "pilarId": "SP",
                    "estandarId": "AP.4",
                    "requerimientoOperacional": "Cuando la solución de la insatisfacción se pueda implementar de inmediato, el Gerente de Servicio o Postventa deberá contactar al Cliente, informándole de las acciones a tomar, dentro de las 24 horas posteriores a la encuesta. El GS o GPV, una vez finalizado el contacto, debe publicar la información resultante en el sistema o control específico del Concesionario;",
                    "comoEvaluar": "Verifique, para los 2 casos analizados en el Requisito AP.4.1, si existe un registro de que el Gerente de Servicio se ha puesto en contacto con usted dentro de las 24 horas, informando las acciones a tomar."
                  },
                  "AP.4.4": {
                    "id": "AP.4.4",
                    "pilarId": "SP",
                    "estandarId": "AP.4",
                    "requerimientoOperacional": "En los casos en que no se pueda ofrecer una solución de manera inmediata, el Gerente de Servicio o Postventa deberá contactar al Cliente en un plazo máximo de 24 horas e informar que se está analizando su insatisfacción, así como la más adecuada para el caso y también el plazo estimado, cuando sea posible. El GS o GPV, una vez finalizado el contacto, debe publicar la información resultante en el sistema o control específico del Concesionario;",
                    "comoEvaluar": "Verifique si existe algún caso en el que la solución no se pueda ofrecer de inmediato y verifique, en el historial de contactos, si existe algún registro que el Gerente de Servicio o Postventa se haya puesto en contacto para informar al Cliente de la marcha del caso."
                  },
                  "AP.4.5": {
                    "id": "AP.4.5",
                    "pilarId": "SP",
                    "estandarId": "AP.4",
                    "requerimientoOperacional": "En el caso de Insatisfacciones detectadas:\r\na) Encuesta por parte del Concesionario - el plazo de cierre del evento es de 10 días naturales.\r\nb) Número 0800 de John Deere: el Concesionario tiene 5 días hábiles para cerrar el evento en el Portal.\r\nc) Encuesta sobre la experiencia del cliente de John Deere: el Concesionario tiene 15 días calendario para cerrar el evento en el Portal.",
                    "comoEvaluar": "Para los casos de insatisfacción identificados a través de la encuesta del Concesionario, verificar en la encuesta del Concesionario consolidada si el plazo de cierre para el hecho cumple con el requisito de un máximo de 10 días.\nPara los casos de insatisfacción identificados a través de 0800, verificar si la hora de cierre del evento cumple con el requisito de un máximo de 5 días hábiles.\nPara los casos de insatisfacción identificados a través de John Deere Experience, verifique en el Portal si el período de cierre para la completarla cumple con el requisito de un máximo de 15 días calendario."
                  },
                  "AP.4.6": {
                    "id": "AP.4.6",
                    "pilarId": "SP",
                    "estandarId": "AP.4",
                    "requerimientoOperacional": "Cuando la solución de la insatisfacción está fuera del alcance o responsabilidad del Concesionario y es necesaria la participación de John Deere, el proceso debe enviarse al ensamblador, junto con el historial de los contactos realizados.",
                    "comoEvaluar": "Observe al menos un caso en el que fue necesaria la participación de John Deere. Busque evidencia de que el proceso se envió a la emblasadora."
                  },
                  "AP.4.7": {
                    "id": "AP.4.7",
                    "pilarId": "SP",
                    "estandarId": "AP.4",
                    "requerimientoOperacional": "El Gerente de Servicio o Postventa debe informar periódicamente al Cliente sobre la marcha del caso y hacer un registro formal de lo tratado en el informe (Ej .: CRM, correo electrónico, etc ...).",
                    "comoEvaluar": "Para insatisfacciones cuyas soluciones no se pudieron ofrecer de manera inmediata, verifique si los registros de los contactos realizados están archivados en una carpeta específica, control específico o en el sistema del Concesionario."
                  },
                  "AP.4.8": {
                    "id": "AP.4.8",
                    "pilarId": "SP",
                    "estandarId": "AP.4",
                    "requerimientoOperacional": "Todos los historiales de contacto, así como las acciones realizadas, deben registrarse en el formulario de Queja del Cliente y archivarse en una carpeta específica, control específico o sistema del Concesionario.",
                    "comoEvaluar": "Verificar (con carpeta propia, sistema del Concesionario o control específico) que los formularios de RAC (Reporte de Atención al Cliente), que contienen el historial de contactos derivados del tratamiento de Insatisfacción, están debidamente archivados en orden cronológico de cierre."
                  },
                  "AP.4.9": {
                    "id": "AP.4.9",
                    "pilarId": "SP",
                    "estandarId": "AP.4",
                    "requerimientoOperacional": "Durante el tratamiento de la insatisfacción:\r\na) Se debe escuchar atentamente la queja del Cliente, parafraseándola para asegurar la comprensión de la queja y evitar malos entendidos, además de mostrar total atención a las inquietudes expresadas por él;\r\nb) Todos los empleados deben trabajar para garantizar que la queja del Cliente se resuelva lo antes posible.",
                    "comoEvaluar": "a,b)) Verificar en los registros del tratamiento de insatisfacciones y en el seguimiento in loco, si los involucrados están preparados y realizan los trámites descritos en los requisitos."
                  },
                  "AP.4.10": {
                    "id": "AP.4.10",
                    "pilarId": "SP",
                    "estandarId": "AP.4",
                    "requerimientoOperacional": "Luego de implementar la solución, el Gerente de Servicio o Postventa deberá contactar con el Cliente, en un plazo máximo de 7 días hábiles, para conocer si las acciones propuestas fueron efectivas y si se recuperó la satisfacción del Cliente.",
                    "comoEvaluar": "Para los casos de insatisfacciones analizados, verificar si el contacto se realizó luego de finalizada la negociación para confirmar con el Cliente que todas las insatisfacciones han sido resueltas y que se ha cumplido el plazo máximo de 07 días hábiles."
                  },
                  "AP.4.11": {
                    "id": "AP.4.11",
                    "pilarId": "SP",
                    "estandarId": "AP.4",
                    "requerimientoOperacional": "El Gerente de Servicio o Postventa deberá elaborar un diagrama de flujo para la efectiva atención de las insatisfacciones recogidas en la Encuesta de Satisfacción y orientar a todos los empleados del Concesionario sobre los procedimientos a seguir con los clientes insatisfechos. También debe garantizar la comprensión total por parte de los equipos (Ventas, Postventa, Repuestos, Administrativo, Limpieza y Seguridad)",
                    "comoEvaluar": "Verificar si existe formalización del flujo de quejas a través de la intranet, en un cuadro de gestión a la vista, en actas de reuniones firmadas por los participantes, etc."
                  }
                }
              }
            }
          },
          "GT": {
            "id": "GT",
            "nombre": "Gestión del Taller",
            "estandares": {
              "GT.1": {
                "id": "GT.1",
                "descripcion": "Aplicación de la Lista de Verificación 5S",
                "requisitos": {
                  "GO.1.1": {
                    "id": "GO.1.1",
                    "pilarId": "GT",
                    "estandarId": "GT.1",
                    "requerimientoOperacional": "El Gerente de Posventa o el Gerente de Servicio debe:\r\n    - Asegurar la implementación del Programa de las 5S para el Departamento de Servicio;     - Aplicar la lista de verificación de las 5S mensualmente para asegurar la organización del taller.",
                    "comoEvaluar": "Compruebe el uso de la Lista de verificación de las 5S / Programa de las 5S para el Departamento de Servicio."
                  },
                  "GO.1.2": {
                    "id": "GO.1.2",
                    "pilarId": "GT",
                    "estandarId": "GT.1",
                    "requerimientoOperacional": "Se debe preparar una escala con los empleados del Departamento de Servicio para aplicar semanalmente el checklist de las 5S, observando:\r\n     a) La correcta aplicación de los Estándares de Servicio;\r\n     b) La correcta organización de los servicios:\r\n            i - Empleados presentes, uniformados e identificados;\r\n           ii - Instalaciones limpias y ordenadas;\r\n          iii - Identificación visual externa e interna del taller, etc.",
                    "comoEvaluar": "Verifique la finalización de las listas de verificación semanales de los últimos dos meses, si las firmó el Gerente de servicio o posventa. Observe si el Gerente de Servicio aplicó personalmente la última lista de verificación de cada mes."
                  },
                  "GO.1.3": {
                    "id": "GO.1.3",
                    "pilarId": "GT",
                    "estandarId": "GT.1",
                    "requerimientoOperacional": "Para las no conformidades encontradas al aplicar la Lista de Verificación de las 5S, desarrollar y monitorear un Plan de Acción, el cual debe establecer las no conformidades encontradas, sus causas raíz, acciones propuestas, los responsables, el plazo de finalización y el estado de implementación de cada acción correctiva.",
                    "comoEvaluar": "Solicitar el Plan de Acción para los elementos no conformes y analizar si cumple con los requisitos de la Norma GO.1.3."
                  },
                  "GO.1.4": {
                    "id": "GO.1.4",
                    "pilarId": "GT",
                    "estandarId": "GT.1",
                    "requerimientoOperacional": "Divulgar los resultados de la lista de verificación y las acciones correctivas en las juntas con el equipo y en el cuadro de gestión a la vista.",
                    "comoEvaluar": "Verificar el registro de divulgación en los tablones de anuncios y las actas de las reuniones. Pregunta 2 Empleados de posventa sobre la divulgación de los resultados del Programa de las 5S y si saben dónde encontrarlos."
                  }
                }
              },
              "GT.2": {
                "id": "GT.2",
                "descripcion": "Incentivo a Calidad y Buenas Prácticas",
                "requisitos": {
                  "GO.2.1": {
                    "id": "GO.2.1",
                    "pilarId": "GT",
                    "estandarId": "GT.2",
                    "requerimientoOperacional": "El Gerente debe desarrollar campañas internas que promuevan la multiplicación de Buenas Prácticas Laborales, con el objetivo de mejorar:\r\n- Productividad y Calidad;\r\n- Seguridad en el trabajo;\r\n- Limpieza y Organización;\r\n- Interacción y mejor clima laboral entre profesionales.",
                    "comoEvaluar": "Solicitar al Gerente de Servicio evidencia de la creación e implementación de campañas internas diseñadas para convertir las Buenas Prácticas percibidas como estándar y dirigidas a maximizar los resultados de los ítems descritos en GO.2.1"
                  },
                  "GO.2.2": {
                    "id": "GO.2.2",
                    "pilarId": "GT",
                    "estandarId": "GT.2",
                    "requerimientoOperacional": "El Concesionario debe proporcionar:\r\n- Un lugar específico para registrar las sugerencias y quejas de los empleados;\r\n- Un cuadro o tablón de difusión de buenas prácticas y resultados obtenidos.",
                    "comoEvaluar": "Solicitar al Gerente de Servicio que presente una evidencia de la existencia de una urna/cuadro o tablón de sugerencias / quejas de los empleados y cómo comparte los resultados obtenidos en la implementación de Buenas Prácticas"
                  },
                  "GO.2.3": {
                    "id": "GO.2.3",
                    "pilarId": "GT",
                    "estandarId": "GT.2",
                    "requerimientoOperacional": "El Administrativo del Taller debe recopilar las sugerencias semanalmente y presentarlas al Gerente responsable, quien debe:\r\n- Dar retroalimentación positiva a todos aquellos que hacen sugerencias, buscando siempre comprender mejor las razones contenidas en las sugerencias;\r\n- Tratar las quejas con confidencialidad e investigarlas, sin exponer al denunciante.",
                    "comoEvaluar": "Solicite al Gerente de Servicio pruebas de las instrucciones dadas a las sugerencias y quejas de los empleados. Cuestionar, por separado, a 2 colaboradores sobre los feedbacks recibidos por el equipo en los últimos 3 meses sobre el grado de confidencialidad con el que se atendieron, principalmente las quejas de los empleados."
                  },
                  "GO.2.4": {
                    "id": "GO.2.4",
                    "pilarId": "GT",
                    "estandarId": "GT.2",
                    "requerimientoOperacional": "Las campañas internas deben ser comunicadas al equipo, mediante junta colectiva con los profesionales y difusión en un Tablón de Anuncios fijado en un lugar de uso frecuente y común (como cafeterías o punto de registro).",
                    "comoEvaluar": "Observar e interrogar al Gerente de Servicio sobre los lugares de divulgación de Planes y resultados relevantes a las campañas internas resultantes de las sugerencias y Buenas Prácticas implementadas."
                  },
                  "GO.2.5": {
                    "id": "GO.2.5",
                    "pilarId": "GT",
                    "estandarId": "GT.2",
                    "requerimientoOperacional": "El Concesionario debe revelar:\r\n- Las Buenas Prácticas implementadas o realizadas por el equipo, presentando y felicitando nominalmente a los responsables de los logros;\r\n- Solución de problemas, felicitando colectivamente al equipo.",
                    "comoEvaluar": "Observar e interrogar al Gerente de Servicio sobre los lugares de divulgación de Planes y resultados relevantes a las campañas internas resultantes de las sugerencias y Buenas Prácticas implementadas. Pregunta 2 a los empleados sobre las formas de difundir las Buenas Prácticas."
                  }
                }
              },
              "GT.3": {
                "id": "GT.3",
                "descripcion": "Incentivo a la Productividad",
                "requisitos": {
                  "GO.3.1": {
                    "id": "GO.3.1",
                    "pilarId": "GT",
                    "estandarId": "GT.3",
                    "requerimientoOperacional": "El concesionario deberá contar con una Política de Incentivos vinculada a resultados individuales para el equipo de Técnicos, en base a los siguientes indicadores:\r\n    . Productividad y Eficiencia\r\n    . Alcanzando objetivos",
                    "comoEvaluar": "Verificar la existencia de la Política de Incentivos dirigida a Técnicos y si está vinculada a los ítems descritos en el requisito."
                  },
                  "GO.3.2": {
                    "id": "GO.3.2",
                    "pilarId": "GT",
                    "estandarId": "GT.3",
                    "requerimientoOperacional": "El Concesionario debe tener una Política de Incentivos vinculada a los resultados del Departamento para el Programador / Apuntador de Servicios, con base en los siguientes indicadores:\r\n    . Productividad y eficiencia\r\n    . Alcanzando objetivos",
                    "comoEvaluar": "Verificar la existencia de la Política de Incentivos dirigida al Programador y si está vinculada a los ítems descritos en el requisito."
                  }
                }
              },
              "GT.4": {
                "id": "GT.4",
                "descripcion": "Capacitación del Equipo",
                "requisitos": {
                  "GO.4.1": {
                    "id": "GO.4.1",
                    "pilarId": "GT",
                    "estandarId": "GT.4",
                    "requerimientoOperacional": "Anualmente, y en conjunto con el Departamento de RRHH, el Concesionario deberá controlar la formación del Equipo Técnico, el Gerente de Postventa y el Gerente de Servicio, teniendo en cuenta los deberes de cada profesional y el Plan de Desarrollo de John Deere.",
                    "comoEvaluar": "Compruebe cómo se lleva a cabo el control y si cubre a todo el equipo, como recomienda John Deere."
                  },
                  "GO.4.2": {
                    "id": "GO.4.2",
                    "pilarId": "GT",
                    "estandarId": "GT.4",
                    "requerimientoOperacional": "Planificar y garantizar la implementación de la capacitación, de acuerdo con la estacionalidad agrícola de la región, mediante la disponibilidad de los recursos necesarios, estimulando la participación y liberación del equipo.",
                    "comoEvaluar": "Consulte el Programa de Capacitación anual del equipo de servicio y asegúrese de que se esté siguiendo el plan."
                  },
                  "GO.4.3": {
                    "id": "GO.4.3",
                    "pilarId": "GT",
                    "estandarId": "GT.4",
                    "requerimientoOperacional": "Junto con RR.HH., defina y registre qué indicadores individuales y del Departamento serán monitoreados y evaluados a través de la Política de Desarrollo de RR.HH.",
                    "comoEvaluar": "Verifique qué indicadores se monitorean y con qué frecuencia se monitorean."
                  },
                  "GO.4.4": {
                    "id": "GO.4.4",
                    "pilarId": "GT",
                    "estandarId": "GT.4",
                    "requerimientoOperacional": "Asegurar que el resto de los empleados estén preparados y capacitados para realizar el servicio de manera eficiente y productiva, analizando, semestralmente, el% de técnicos capacitados, el nivel de desempeño individual y, en cuando necesario, estableciendo un Plan de Acción para adecuar la asistencia técnica de capacitación a empleados.",
                    "comoEvaluar": "Verifique cómo se monitorea la evolución del desempeño y la capacitación de los empleados en el Departamento de Servicio. Observar si el control se realiza cada seis meses."
                  }
                }
              },
              "GT.5": {
                "id": "GT.5",
                "descripcion": "Monitoreo de las Encuestas de Satisfacción",
                "requisitos": {
                  "GO.5.1": {
                    "id": "GO.5.1",
                    "pilarId": "GT",
                    "estandarId": "GT.5",
                    "requerimientoOperacional": "El Gerente de Marketing debe divulgar formalmente el resultado mensual de la Encuesta de Satisfacción a los empleados involucrados directa e indirectamente en la prestación de servicios.",
                    "comoEvaluar": "Verificar la evidencia de la divulgación del Resultado mensual de la Investigación y de las acciones para cumplir con las metas."
                  },
                  "GO.5.2": {
                    "id": "GO.5.2",
                    "pilarId": "GT",
                    "estandarId": "GT.5",
                    "requerimientoOperacional": "El Gerente de Posventa o el Gerente de Servicio debe:\r\n- Guiar al equipo para alcanzar y cumplir los objetivos de satisfacción del departamento;\r\n- Consolidar y categorizar las ocurrencias de insatisfacción en el mes, así como las acciones tomadas para rescatar la satisfacción del cliente y evitar recurrencias, así como los resultados;\r\n- Analizar el consolidado de las insatisfacciones y elaborar un Plan de Acción con análisis de causa raíz hasta el día 10 del mes siguiente, para inhibir la recurrencia;\r\n- Monitorear y evidenciar el estado de los Planes de Acción y la implementación de actividades;\r\n- Archivar en carpeta específica, física o virtual, el registro de insatisfacciones planteadas, para eventual consulta o seguimiento.",
                    "comoEvaluar": "Consulte los informes consolidados de los 02 meses anteriores y compruebe si cumplen con el requisito.\nConsulta el Plan de Acción del mes anterior y observa si se realizó el análisis de causa raíz de las acciones establecidas y, luego de identificar las causas reales, qué medidas se tomaron para evitar recurrencias.\nVerifique los Planes de Acción, si se monitorea y cómo se monitorea la evolución de las acciones tomadas y si el status de su implementación se evidencia individualmente. Comprueba si los Planes de Acción de los meses anteriores están archivados en una carpeta específica (física o electrónica) de fácil consulta."
                  }
                }
              },
              "GT.6": {
                "id": "GT.6",
                "descripcion": "Plan de Mejoría Contínua",
                "requisitos": {
                  "GO.6.1": {
                    "id": "GO.6.1",
                    "pilarId": "GT",
                    "estandarId": "GT.6",
                    "requerimientoOperacional": "El Gerente de Postventa o Gerente de Servicio debe elaborar Planes de Acción orientados al cumplimiento de los objetivos, los cuales tienen en cuenta los siguientes puntos:\r\n- La causa raíz del problema;\r\n- Descripción de acción correctiva, preventiva o de mejora continua;\r\n- Tener un Responsable de la acción;\r\n- Tener un indicador que monitoree la efectividad de la acción;\r\n- Tener una fecha de inicio definida para la implementación y una fecha límite para la implementación de la acción;\r\n- Sea realista (factible de implementar).",
                    "comoEvaluar": "Verifique 2 planes de acción aleatorios para verificar si contienem todos los requisitos enumerados en GO..6.1"
                  },
                  "GO.6.2": {
                    "id": "GO.6.2",
                    "pilarId": "GT",
                    "estandarId": "GT.6",
                    "requerimientoOperacional": "El Gerente de Postventa o Gerente de Servicio debe reunirse mensualmente con los miembros del Comité de Calidad, responsables por implementar las acciones, para:\r\n- Cobrar el progreso y el cumplimiento de las actividades;\r\n- Ccuando necesario, comunicar nuevas acciones para mejorar correcciones, prevenciones o mejora continua.",
                    "comoEvaluar": "Verificar la existencia de Actas de la Junta del Comité de Calidad u otras evidencias, que contengan la relación de los temas tratados y la firma de todos los participantes."
                  },
                  "GO.6.3": {
                    "id": "GO.6.3",
                    "pilarId": "GT",
                    "estandarId": "GT.6",
                    "requerimientoOperacional": "Evidenciar el status de seguimiento de las acciones propuestas para corregir inconsistencias y las contramedidas adoptadas, cuando sea necesario.",
                    "comoEvaluar": "Verifique en los 2 Planes de Acción si existe evidencia para monitorear el estado de implementación de las acciones propuestas y si se tomaron contramedidas a aquellas cuya acción no resultó en un efecto satisfactorio."
                  }
                }
              }
            }
          }
        };

        try {
            for (const pilarKey in checklistData) {
                const pilar = checklistData[pilarKey];
                const pilarRef = doc(db, 'checklist', pilar.id);
                await setDoc(pilarRef, { id: pilar.id, nombre: pilar.nombre });

                for (const estandarKey in pilar.estandares) {
                    const estandar = pilar.estandares[estandarKey];
                    const estandarRef = doc(db, 'checklist', pilar.id, 'estandares', estandar.id);
                    await setDoc(estandarRef, { id: estandar.id, descripcion: estandar.descripcion });

                    for (const reqKey in estandar.requisitos) {
                        const requisito = estandar.requisitos[reqKey];
                        const reqRef = doc(db, 'checklist', pilar.id, 'estandares', estandar.id, 'requisitos', requisito.id);
                        await setDoc(reqRef, requisito);
                    }
                }
            }
            toast.dismiss();
            toast.success("¡Base de datos poblada con éxito!");
        } catch (error) {
            toast.dismiss();
            toast.error("Error al poblar la base de datos.");
            console.error("Seeding error:", error);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="card" style={{marginTop: '2rem', background: 'var(--warning-color)'}}>
            <h3>Herramienta de Administrador</h3>
            <p>Este botón cargará la lista de verificación inicial en Firestore. <strong>Úsalo solo una vez o para corregir datos.</strong></p>
            <button onClick={seedDatabase} disabled={loading} className="btn btn-primary">
                {loading ? 'Poblando...' : 'Poblar Base de Datos'}
            </button>
        </div>
    );
};

export default SeedDatabaseButton;