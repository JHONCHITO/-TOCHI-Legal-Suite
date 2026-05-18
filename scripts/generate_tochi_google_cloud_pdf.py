from __future__ import annotations

from pathlib import Path
from typing import Iterable

from reportlab.graphics.shapes import Drawing, Rect, String, Line, Polygon
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "output" / "pdf"
OUT_DIR.mkdir(parents=True, exist_ok=True)
OUT_FILE = OUT_DIR / "TOCHI_Legal_Suite_Despliegue_Google_Cloud.pdf"

NAVY = colors.HexColor("#0F2747")
BLUE = colors.HexColor("#2F80ED")
SKY = colors.HexColor("#EAF2FF")
TEAL = colors.HexColor("#0F766E")
MUTED = colors.HexColor("#5B6575")
TEXT = colors.HexColor("#1F2937")
LIGHT = colors.HexColor("#F8FAFC")
BORDER = colors.HexColor("#D9E2EF")
SOFT = colors.HexColor("#F4F7FB")


def find_font(candidates: Iterable[str]) -> str | None:
    for candidate in candidates:
        if Path(candidate).exists():
            return candidate
    return None


def register_font_family() -> tuple[str, str]:
    regular = find_font(
        [
            r"C:\Windows\Fonts\arial.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
        ]
    )
    bold = find_font(
        [
            r"C:\Windows\Fonts\arialbd.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf",
        ]
    )

    if regular and bold:
        pdfmetrics.registerFont(TTFont("TOCHI-Regular", regular))
        pdfmetrics.registerFont(TTFont("TOCHI-Bold", bold))
        return "TOCHI-Regular", "TOCHI-Bold"

    return "Helvetica", "Helvetica-Bold"


BODY_FONT, BOLD_FONT = register_font_family()


def build_styles():
    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="CoverTitle",
            fontName=BOLD_FONT,
            fontSize=26,
            leading=30,
            textColor=NAVY,
            alignment=TA_LEFT,
            spaceAfter=4,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CoverSubtitle",
            fontName=BODY_FONT,
            fontSize=13.5,
            leading=17,
            textColor=TEAL,
            alignment=TA_LEFT,
            spaceAfter=10,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Body",
            fontName=BODY_FONT,
            fontSize=10.5,
            leading=14,
            textColor=TEXT,
            alignment=TA_JUSTIFY,
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="BodySmall",
            fontName=BODY_FONT,
            fontSize=9.5,
            leading=12.5,
            textColor=MUTED,
            alignment=TA_JUSTIFY,
            spaceAfter=4,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Section",
            fontName=BOLD_FONT,
            fontSize=16,
            leading=20,
            textColor=NAVY,
            alignment=TA_LEFT,
            spaceBefore=3,
            spaceAfter=8,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Subsection",
            fontName=BOLD_FONT,
            fontSize=11.5,
            leading=14,
            textColor=NAVY,
            alignment=TA_LEFT,
            spaceBefore=5,
            spaceAfter=4,
        )
    )
    styles.add(
        ParagraphStyle(
            name="List",
            fontName=BODY_FONT,
            fontSize=10.4,
            leading=14,
            textColor=TEXT,
            leftIndent=14,
            firstLineIndent=0,
            spaceAfter=2,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Label",
            fontName=BOLD_FONT,
            fontSize=9.2,
            leading=11,
            textColor=NAVY,
            alignment=TA_LEFT,
            spaceAfter=0,
        )
    )
    styles.add(
        ParagraphStyle(
            name="TableHeader",
            fontName=BOLD_FONT,
            fontSize=9.3,
            leading=11,
            textColor=colors.white,
            alignment=TA_LEFT,
            spaceAfter=0,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Footer",
            fontName=BODY_FONT,
            fontSize=8.5,
            leading=10,
            textColor=MUTED,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Callout",
            fontName=BODY_FONT,
            fontSize=10.3,
            leading=13.2,
            textColor=TEXT,
            alignment=TA_JUSTIFY,
            spaceAfter=0,
        )
    )
    return styles


STYLES = build_styles()


def p(text: str, style_name: str = "Body") -> Paragraph:
    return Paragraph(text, STYLES[style_name])


def box(flowable, fill=SOFT, border=BORDER, padding=8, stroke=0.8):
    table = Table([[flowable]], colWidths=[170 * mm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), fill),
                ("BOX", (0, 0), (-1, -1), stroke, border),
                ("LEFTPADDING", (0, 0), (-1, -1), padding),
                ("RIGHTPADDING", (0, 0), (-1, -1), padding),
                ("TOPPADDING", (0, 0), (-1, -1), padding),
                ("BOTTOMPADDING", (0, 0), (-1, -1), padding),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    return table


def styled_table(data, col_widths, header_rows=1, alt=False):
    table = Table(data, colWidths=col_widths, repeatRows=header_rows, hAlign="LEFT")
    style = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), BOLD_FONT),
        ("FONTSIZE", (0, 0), (-1, 0), 9.2),
        ("LEADING", (0, 0), (-1, -1), 12),
        ("GRID", (0, 0), (-1, -1), 0.6, BORDER),
        ("BOX", (0, 0), (-1, -1), 0.8, BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]
    if alt:
        for row in range(1, len(data)):
            if row % 2 == 1:
                style.append(("BACKGROUND", (0, row), (-1, row), LIGHT))
    table.setStyle(TableStyle(style))
    return table


def title_with_rule(text: str):
    return Table(
        [
            [
                Paragraph(text, STYLES["Section"]),
            ]
        ],
        colWidths=[170 * mm],
    )


def bullet_paragraph(text: str) -> Paragraph:
    return Paragraph(f"• {text}", STYLES["List"])


def add_header_footer(canvas, doc):
    canvas.saveState()
    width, height = A4
    page_num = canvas.getPageNumber()

    if page_num > 1:
        canvas.setStrokeColor(BORDER)
        canvas.setLineWidth(0.8)
        canvas.line(doc.leftMargin, height - 15 * mm, width - doc.rightMargin, height - 15 * mm)
        canvas.setFont(BODY_FONT, 8.3)
        canvas.setFillColor(MUTED)
        canvas.drawString(doc.leftMargin, height - 12.5 * mm, "TOCHI Legal Suite | Despliegue en Google Cloud")
        canvas.drawRightString(width - doc.rightMargin, height - 12.5 * mm, f"Página {page_num}")

        canvas.setStrokeColor(BORDER)
        canvas.setLineWidth(0.8)
        canvas.line(doc.leftMargin, 12 * mm, width - doc.rightMargin, 12 * mm)
        canvas.setFont(BODY_FONT, 8)
        canvas.setFillColor(MUTED)
        canvas.drawString(doc.leftMargin, 8.2 * mm, "Documento técnico y de exposición")
        canvas.drawRightString(width - doc.rightMargin, 8.2 * mm, "TOCHI Legal Suite")

    canvas.restoreState()


def add_cover_background(canvas, doc):
    canvas.saveState()
    width, height = A4
    canvas.setFillColor(LIGHT)
    canvas.rect(0, 0, width, height, stroke=0, fill=1)
    canvas.setFillColor(NAVY)
    canvas.rect(0, height - 44 * mm, width, 44 * mm, stroke=0, fill=1)
    canvas.setFillColor(BLUE)
    canvas.rect(0, height - 45.5 * mm, width, 1.5 * mm, stroke=0, fill=1)
    canvas.setFillColor(colors.white)
    canvas.setFont(BOLD_FONT, 11)
    canvas.drawString(doc.leftMargin, height - 13.5 * mm, "TOCHI Legal Suite")
    canvas.setFont(BODY_FONT, 9)
    canvas.drawRightString(width - doc.rightMargin, height - 13.5 * mm, "Google Cloud · Ubuntu · Nginx · Certbot")
    canvas.restoreState()


def cover_page():
    story = []
    story.append(Spacer(1, 42 * mm))
    story.append(Paragraph("TOCHI Legal Suite", STYLES["CoverTitle"]))
    story.append(Paragraph("Despliegue completo en Google Cloud y publicación en producción", STYLES["CoverSubtitle"]))
    story.append(
        p(
            "Este documento explica, de forma clara y ordenada, cómo se pasó de un proyecto web de desarrollo a una solución pública operando sobre una máquina virtual con Ubuntu, Nginx, certificados HTTPS, servicios automáticos y base de datos externa.",
            "Body",
        )
    )
    story.append(Spacer(1, 5 * mm))

    keyfacts = [
        [Paragraph("<b>Plataforma</b>", STYLES["Label"]), Paragraph("Google Cloud Compute Engine", STYLES["Body"])],
        [Paragraph("<b>Sistema operativo</b>", STYLES["Label"]), Paragraph("Ubuntu 24.04 LTS", STYLES["Body"])],
        [Paragraph("<b>Servidor web</b>", STYLES["Label"]), Paragraph("Nginx como proxy inverso", STYLES["Body"])],
        [Paragraph("<b>HTTPS</b>", STYLES["Label"]), Paragraph("Let’s Encrypt con Certbot", STYLES["Body"])],
        [Paragraph("<b>Base de datos</b>", STYLES["Label"]), Paragraph("MongoDB Atlas", STYLES["Body"])],
        [Paragraph("<b>Dominio</b>", STYLES["Label"]), Paragraph("www.tochilegalsuite.online y api.tochilegalsuite.online", STYLES["Body"])],
    ]
    key_table = styled_table(keyfacts, [42 * mm, 120 * mm], header_rows=0, alt=True)
    key_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.white),
                ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, LIGHT]),
                ("BOX", (0, 0), (-1, -1), 0.8, BORDER),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, BORDER),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
        )
    )
    story.append(key_table)
    story.append(Spacer(1, 7 * mm))

    summary = box(
        p(
            "<b>Resumen ejecutivo.</b> TOCHI quedó desplegado en una VM con IP estática, con el frontend y el backend corriendo como servicios de sistema. Nginx recibe las peticiones por HTTPS y las distribuye al puerto correcto; MongoDB Atlas conserva la información del sistema; y Certbot mantiene el certificado renovable automáticamente.",
            "Callout",
        ),
        fill=SKY,
        border=colors.HexColor("#B7C8E6"),
        padding=10,
    )
    story.append(summary)
    story.append(Spacer(1, 10 * mm))

    footer_note = Paragraph(
        "Documento preparado para exposición, sustentación y entrega técnica.",
        ParagraphStyle(
            name="CoverFooterNote",
            fontName=BOLD_FONT,
            fontSize=9.5,
            leading=12,
            textColor=MUTED,
            alignment=TA_CENTER,
        ),
    )
    story.append(footer_note)
    return story


def architecture_drawing():
    d = Drawing(500, 170)

    box_fill = colors.HexColor("#F5F9FF")
    border = colors.HexColor("#5C7EA6")
    accent = BLUE
    soft = colors.HexColor("#D7E6FB")

    def add_box(x, y, w, h, title, body, fill=box_fill):
        d.add(Rect(x, y, w, h, rx=10, ry=10, strokeColor=border, fillColor=fill, strokeWidth=1))
        d.add(String(x + 10, y + h - 18, title, fontName=BOLD_FONT, fontSize=10.5, fillColor=NAVY))
        d.add(String(x + 10, y + h - 34, body, fontName=BODY_FONT, fontSize=8.4, fillColor=MUTED))

    def arrow(x1, y1, x2, y2, color=accent):
        d.add(Line(x1, y1, x2, y2, strokeColor=color, strokeWidth=1.4))
        if x2 > x1:
            tri = Polygon([x2, y2, x2 - 6, y2 + 3, x2 - 6, y2 - 3], strokeColor=color, fillColor=color)
        else:
            tri = Polygon([x2, y2, x2 + 6, y2 + 3, x2 + 6, y2 - 3], strokeColor=color, fillColor=color)
        d.add(tri)

    add_box(10, 110, 86, 42, "Usuario", "Navegador / móvil", fill=soft)
    add_box(120, 110, 86, 42, "DNS", "Hostinger apunta al VPS", fill=soft)
    add_box(230, 110, 86, 42, "Nginx", "Proxy inverso y SSL", fill=soft)
    add_box(120, 25, 86, 42, "Frontend", "Next.js · puerto 3000")
    add_box(230, 25, 86, 42, "Backend", "Next.js/Node · puerto 4000")
    add_box(360, 25, 120, 42, "MongoDB Atlas", "Persistencia de datos y colecciones", fill=soft)

    arrow(96, 131, 120, 131)
    arrow(206, 131, 230, 131)
    arrow(273, 110, 162, 67)
    arrow(273, 110, 273, 67)
    arrow(316, 46, 360, 46)
    arrow(206, 46, 360, 46)

    d.add(String(10, 5, "El Nginx del servidor distribuye las solicitudes públicas entre el frontend y el backend.", fontName=BODY_FONT, fontSize=8.4, fillColor=MUTED))
    return d


def build_story():
    story = []

    story.extend(cover_page())
    story.append(PageBreak())

    story.append(Paragraph("1. Resumen ejecutivo", STYLES["Section"]))
    story.append(
        p(
            "TOCHI Legal Suite fue trasladado desde el entorno de desarrollo a una infraestructura pública en Google Cloud para que quedara disponible con dominio propio, HTTPS, procesos automáticos de arranque y una base de datos externa. El objetivo principal fue consolidar una plataforma estable, accesible y administrable sin depender de una máquina local.",
            "Body",
        )
    )
    story.append(
        p(
            "El despliegue combinó varias capas: una máquina virtual con Ubuntu 24.04 LTS, la aplicación Next.js compilada en producción, Nginx como puerta de entrada, Certbot para HTTPS y MongoDB Atlas como almacenamiento persistente. A esto se sumó la configuración del DNS para que el dominio público dirigiera el tráfico al servidor correcto.",
            "Body",
        )
    )
    story.append(
        box(
            p(
                "<b>Idea central:</b> la aplicación no quedó publicada “por una sola acción”, sino por la suma de infraestructura, configuración de red, procesos de sistema y validación de seguridad. Esa combinación es la que permite que TOCHI se comporte como un servicio real en internet.",
                "Callout",
            ),
            fill=SKY,
            border=colors.HexColor("#B7C8E6"),
            padding=10,
        )
    )
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph("2. Objetivo del despliegue", STYLES["Section"]))
    story.append(
        p(
            "El objetivo fue convertir la aplicación en una solución profesional de producción que pudiera atender usuarios externos con un dominio institucional, separando claramente la interfaz pública, la lógica de negocio y la persistencia de datos.",
            "Body",
        )
    )
    story.append(
        p(
            "También se buscó asegurar tres condiciones técnicas esenciales: disponibilidad continua, seguridad básica por HTTPS y posibilidad de reinicio automático de los servicios si el sistema operativo o la aplicación presentaban una falla.",
            "Body",
        )
    )
    story.append(Spacer(1, 3 * mm))
    story.append(
        styled_table(
            [
                [Paragraph("Componente", STYLES["TableHeader"]), Paragraph("Función dentro del proyecto", STYLES["TableHeader"])],
                [Paragraph("Google Cloud VM", STYLES["Body"]), Paragraph("Servidor Linux que hospeda toda la solución.", STYLES["Body"])],
                [Paragraph("Nginx", STYLES["Body"]), Paragraph("Proxy inverso que enruta frontend y backend.", STYLES["Body"])],
                [Paragraph("Certbot", STYLES["Body"]), Paragraph("Emite y renueva el certificado HTTPS.", STYLES["Body"])],
                [Paragraph("systemd", STYLES["Body"]), Paragraph("Mantiene procesos activos y reinicia servicios.", STYLES["Body"])],
                [Paragraph("MongoDB Atlas", STYLES["Body"]), Paragraph("Guarda usuarios, casos, documentos y normas.", STYLES["Body"])],
            ],
            [42 * mm, 128 * mm],
            header_rows=1,
            alt=True,
        )
    )
    story.append(PageBreak())

    story.append(Paragraph("3. Paso a paso del despliegue", STYLES["Section"]))
    steps = [
        (
            "Provisionamiento de la VM",
            "Se creó una máquina virtual en Google Cloud Compute Engine con Ubuntu 24.04 LTS. La VM actuó como servidor principal y recibió una IP estática para evitar cambios de dirección con el tiempo.",
        ),
        (
            "Instalación del entorno base",
            "Se instalaron las utilidades de sistema necesarias: curl, git, nginx, build-essential y Node.js 20. Con ello quedó listo el entorno para compilar y servir la aplicación.",
        ),
        (
            "Clonado del repositorio",
            "El repositorio de TOCHI se llevó a /opt/tochi/TOCHI_LEGAL_SUITE, que pasó a ser la carpeta de trabajo de producción.",
        ),
        (
            "Configuración de variables de entorno",
            "Se definieron backend.env y frontend/.env.local con credenciales de MongoDB Atlas, OpenAI, autenticación, correo, Wompi y URLs públicas del dominio final.",
        ),
        (
            "Compilación en modo producción",
            "Se ejecutaron npm ci y npm run build para generar la versión optimizada de Next.js en el frontend y en el backend. Durante esta etapa también se corrigieron ajustes puntuales del build.",
        ),
    ]
    for idx, (title, body) in enumerate(steps, 1):
        story.append(Paragraph(f"{idx}. {title}", STYLES["Subsection"]))
        story.append(p(body, "Body"))

    story.append(PageBreak())

    story.append(Paragraph("4. Servicios automáticos y proxy reverso", STYLES["Section"]))
    story.append(
        p(
            "Para que la aplicación no dependiera de una sesión SSH abierta, se crearon dos servicios systemd: uno para el frontend y otro para el backend. Ambos quedan configurados para arrancar con el usuario de sistema `tochi`, conservar logs en journalctl y reiniciarse automáticamente si ocurre una falla.",
            "Body",
        )
    )
    story.append(
        p(
            "Nginx quedó como el punto de entrada público. El bloque de configuración distingue entre el dominio principal y el subdominio de API, redirigiendo cada petición al puerto interno adecuado. Esa separación evita exponer directamente los procesos de Next.js y mantiene una arquitectura más limpia.",
            "Body",
        )
    )
    story.append(Spacer(1, 3 * mm))
    story.append(architecture_drawing())
    story.append(Spacer(1, 4 * mm))
    story.append(
        styled_table(
            [
                [Paragraph("Dominio", STYLES["TableHeader"]), Paragraph("Servicio asociado", STYLES["TableHeader"]), Paragraph("Puerto interno", STYLES["TableHeader"])],
                [Paragraph("tochilegalsuite.online<br/>www.tochilegalsuite.online", STYLES["Body"]), Paragraph("Frontend", STYLES["Body"]), Paragraph("3000", STYLES["Body"])],
                [Paragraph("api.tochilegalsuite.online", STYLES["Body"]), Paragraph("Backend", STYLES["Body"]), Paragraph("4000", STYLES["Body"])],
            ],
            [72 * mm, 48 * mm, 40 * mm],
            header_rows=1,
            alt=True,
        )
    )

    story.append(PageBreak())

    story.append(Paragraph("5. DNS, dominio y HTTPS", STYLES["Section"]))
    story.append(
        p(
            "Una vez que la aplicación quedó funcionando internamente en la VM, se configuró el dominio en el proveedor DNS para que el tráfico público resolviera hacia la IP estática del servidor. En producción quedaron activos tres registros A apuntando a 34.58.5.145.",
            "Body",
        )
    )
    story.append(
        styled_table(
            [
                [Paragraph("Host", STYLES["TableHeader"]), Paragraph("Tipo", STYLES["TableHeader"]), Paragraph("Destino", STYLES["TableHeader"])],
                [Paragraph("@", STYLES["Body"]), Paragraph("A", STYLES["Body"]), Paragraph("34.58.5.145", STYLES["Body"])],
                [Paragraph("www", STYLES["Body"]), Paragraph("A", STYLES["Body"]), Paragraph("34.58.5.145", STYLES["Body"])],
                [Paragraph("api", STYLES["Body"]), Paragraph("A", STYLES["Body"]), Paragraph("34.58.5.145", STYLES["Body"])],
            ],
            [25 * mm, 24 * mm, 110 * mm],
            header_rows=1,
            alt=True,
        )
    )
    story.append(Spacer(1, 4 * mm))
    story.append(
        p(
            "Después de validar la resolución DNS, se instaló Certbot y se emitió un certificado de Let’s Encrypt para el dominio raíz, `www` y `api`. Con eso, Nginx quedó sirviendo la aplicación por HTTPS y renovando el certificado de forma automática.",
            "Body",
        )
    )
    story.append(
        box(
            p(
                "<b>Resultado final:</b> el sitio quedó accesible por `https://www.tochilegalsuite.online`, la API por `https://api.tochilegalsuite.online` y la infraestructura quedó lista para operar sin depender de la máquina local del desarrollador.",
                "Callout",
            ),
            fill=colors.HexColor("#EDF7F4"),
            border=colors.HexColor("#BEE3D7"),
            padding=10,
        )
    )
    story.append(PageBreak())

    story.append(Paragraph("6. Cómo funciona la solución en producción", STYLES["Section"]))
    story.append(
        p(
            "Cuando una persona entra a TOCHI, el navegador resuelve el dominio mediante DNS y la solicitud llega a la VM de Google Cloud. Nginx recibe esa conexión, aplica HTTPS y la envía al servicio correcto. Si la petición es de interfaz, va al frontend; si es de datos o lógica, va al backend.",
            "Body",
        )
    )
    story.append(
        p(
            "El frontend renderiza la experiencia del usuario y consume la API cuando necesita información. El backend ejecuta la lógica de negocio, autentica usuarios, gestiona casos, documentos, notificaciones, normas y demás módulos. MongoDB Atlas guarda la persistencia fuera de la máquina virtual, lo que mejora la estabilidad y facilita el crecimiento.",
            "Body",
        )
    )
    flow_items = [
        "El usuario abre el dominio en el navegador o en el móvil.",
        "El DNS lo dirige a la IP pública de la VM.",
        "Nginx valida y termina la conexión HTTPS.",
        "La petición se enruta al frontend o al backend.",
        "El backend consulta MongoDB Atlas y, si hace falta, otros servicios externos.",
        "La respuesta vuelve al navegador con la información solicitada.",
    ]
    for item in flow_items:
        story.append(bullet_paragraph(item))

    story.append(Spacer(1, 4 * mm))
    story.append(
        box(
            p(
                "Este patrón permite separar responsabilidades: la web no depende de un único proceso monolítico, la base de datos no vive dentro de la VM y los servicios se mantienen activos incluso después de cerrar la sesión SSH.",
                "Callout",
            ),
            fill=SKY,
            border=colors.HexColor("#B7C8E6"),
            padding=10,
        )
    )
    story.append(PageBreak())

    story.append(Paragraph("7. Ajustes y problemas resueltos durante la puesta en línea", STYLES["Section"]))
    issue_rows = [
        [Paragraph("Problema", STYLES["TableHeader"]), Paragraph("Acción aplicada", STYLES["TableHeader"]), Paragraph("Resultado", STYLES["TableHeader"])],
        [Paragraph("Build checkout", STYLES["Body"]), Paragraph("Se separó el componente cliente y se envolvió con Suspense.", STYLES["Body"]), Paragraph("El build volvió a compilar correctamente.", STYLES["Body"])],
        [Paragraph("Permisos y owner en la VM", STYLES["Body"]), Paragraph("Se corrigieron ownerships con chown y se creó el usuario tochi.", STYLES["Body"]), Paragraph("Los servicios systemd pudieron iniciar sin EACCES.", STYLES["Body"])],
        [Paragraph("MongoDB Atlas al límite", STYLES["Body"]), Paragraph("Se limpió la colección `normas` y se liberó espacio.", STYLES["Body"]), Paragraph("Las escrituras dejaron de estar bloqueadas.", STYLES["Body"])],
        [Paragraph("Integración de pagos", STYLES["Body"]), Paragraph("Se cargaron variables de Wompi en frontend/.env.local.", STYLES["Body"]), Paragraph("El checkout quedó preparado para producción.", STYLES["Body"])],
    ]
    story.append(styled_table(issue_rows, [44 * mm, 74 * mm, 52 * mm], header_rows=1, alt=True))
    story.append(Spacer(1, 5 * mm))
    story.append(
        p(
            "Estos ajustes no cambiaron la arquitectura general; simplemente completaron la madurez de producción y resolvieron fricciones típicas de un despliegue real.",
            "Body",
        )
    )
    story.append(Paragraph("8. Mantenimiento recomendado", STYLES["Section"]))
    maintenance_items = [
        "Verificar periódicamente el estado de los servicios: systemctl status tochi-backend, tochi-frontend y nginx.",
        "Confirmar que Certbot renueve el certificado automáticamente y revisar su vigencia de vez en cuando.",
        "Monitorear MongoDB Atlas para evitar superar de nuevo el almacenamiento disponible.",
        "Respaldar datos críticos y, si el volumen de PDFs crece, considerar mover archivos pesados fuera de MongoDB.",
        "Revisar logs de la aplicación cuando se agreguen nuevos módulos o integraciones.",
    ]
    for item in maintenance_items:
        story.append(bullet_paragraph(item))

    story.append(
        box(
            p(
                "<b>Nota operativa:</b> si una red externa bloquea el dominio por política de seguridad, eso no implica una falla de TOCHI. La aplicación continúa operando correctamente; el acceso debe probarse desde una red distinta o mediante una lista blanca del administrador de red.",
                "Callout",
            ),
            fill=colors.HexColor("#FFF8E7"),
            border=colors.HexColor("#E7D29D"),
            padding=10,
        )
    )
    story.append(PageBreak())

    story.append(Paragraph("9. Guion breve para exponer", STYLES["Section"]))
    expo_points = [
        "Primero, TOCHI se desarrolló como una plataforma legal web basada en Next.js, MongoDB y servicios auxiliares de IA y gestión.",
        "Después, se creó una VM en Google Cloud con Ubuntu 24.04 para convertir la solución en un sistema de producción.",
        "Luego, se configuraron Nginx, systemd, DNS y Certbot para publicar la aplicación con dominio propio y HTTPS.",
        "Finalmente, se validó que el frontend, el backend y la base de datos funcionaran de forma independiente pero coordinada.",
        "El resultado es una aplicación estable, accesible en línea y lista para una presentación formal o una demostración técnica.",
    ]
    for point in expo_points:
        story.append(bullet_paragraph(point))

    story.append(Spacer(1, 4 * mm))
    story.append(
        box(
            p(
                "<b>Conclusión.</b> TOCHI Legal Suite quedó desplegado como una solución web real y administrable. El proyecto pasó de un entorno local a una infraestructura pública en Google Cloud con alta estabilidad operativa, separación de servicios y acceso seguro por HTTPS.",
                "Callout",
            ),
            fill=SKY,
            border=colors.HexColor("#B7C8E6"),
            padding=11,
        )
    )
    return story


def build_pdf():
    doc = SimpleDocTemplate(
        str(OUT_FILE),
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=20 * mm,
        bottomMargin=18 * mm,
        title="TOCHI Legal Suite - Despliegue en Google Cloud",
        author="Codex",
        subject="Documento técnico y de exposición",
        creator="Codex / ReportLab",
    )

    story = build_story()
    doc.build(story, onFirstPage=add_cover_background, onLaterPages=add_header_footer)


if __name__ == "__main__":
    build_pdf()
    print(f"PDF generated at: {OUT_FILE}")
