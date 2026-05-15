from __future__ import annotations

from datetime import date
from pathlib import Path
from typing import Iterable

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    KeepTogether,
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    Preformatted,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "output" / "pdf"
OUTPUT_FILE = OUTPUT_DIR / "TOCHI_Legal_Suite_Exposicion_Ubuntu.pdf"


def build_styles():
    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="TitleX",
            parent=styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=24,
            leading=28,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#103B66"),
            spaceAfter=8,
        )
    )
    styles.add(
        ParagraphStyle(
            name="SubtitleX",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=11,
            leading=14,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#4A5568"),
            spaceAfter=10,
        )
    )
    styles.add(
        ParagraphStyle(
            name="SectionX",
            parent=styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=15,
            leading=18,
            textColor=colors.HexColor("#103B66"),
            spaceBefore=10,
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="SubsectionX",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=11.5,
            leading=14,
            textColor=colors.HexColor("#1C4F82"),
            spaceBefore=6,
            spaceAfter=4,
        )
    )
    styles.add(
        ParagraphStyle(
            name="BodyX",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=10.2,
            leading=14,
            alignment=TA_LEFT,
            spaceAfter=5,
        )
    )
    styles.add(
        ParagraphStyle(
            name="SmallX",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=8.7,
            leading=11,
            textColor=colors.HexColor("#4A5568"),
            spaceAfter=2,
        )
    )
    styles.add(
        ParagraphStyle(
            name="BulletX",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=10,
            leading=13,
            leftIndent=10,
            firstLineIndent=0,
            spaceAfter=2,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CodeX",
            parent=styles["Code"],
            fontName="Courier",
            fontSize=8.7,
            leading=10.5,
            backColor=colors.HexColor("#F7FAFC"),
            borderColor=colors.HexColor("#CBD5E0"),
            borderWidth=0.5,
            borderPadding=6,
            borderRadius=4,
            leftIndent=0,
            rightIndent=0,
            spaceAfter=6,
        )
    )
    return styles


def page_decor(canvas, doc):
    width, height = A4
    canvas.saveState()
    canvas.setFillColor(colors.HexColor("#103B66"))
    canvas.rect(0, height - 18 * mm, width, 18 * mm, fill=1, stroke=0)
    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica-Bold", 9)
    canvas.drawString(14 * mm, height - 10.5 * mm, "TOCHI Legal Suite - Despliegue en Ubuntu")
    canvas.setFont("Helvetica", 8)
    canvas.drawRightString(width - 14 * mm, 8.5 * mm, f"Pagina {doc.page}")
    canvas.setStrokeColor(colors.HexColor("#D9E2EC"))
    canvas.setLineWidth(0.5)
    canvas.line(14 * mm, 14 * mm, width - 14 * mm, 14 * mm)
    canvas.restoreState()


def title_box(title: str, subtitle: str, styles) -> list:
    box = Table(
        [
            [
                Paragraph(
                    f"<para align='center'><font size=24><b>{title}</b></font><br/><font size=11>{subtitle}</font></para>",
                    styles["BodyX"],
                )
            ]
        ],
        colWidths=[170 * mm],
    )
    box.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#EEF4FA")),
                ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#B6C8DA")),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 14),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
            ]
        )
    )
    return [box]


def make_kv_table(rows: list[tuple[str, str]], styles):
    data = [[Paragraph(f"<b>{k}</b>", styles["BodyX"]), Paragraph(v, styles["BodyX"])] for k, v in rows]
    tbl = Table(data, colWidths=[48 * mm, 110 * mm], repeatRows=0)
    tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.white),
                ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.HexColor("#F8FBFE"), colors.white]),
                ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#C7D7E6")),
                ("INNERGRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#D9E2EC")),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    return tbl


def section(title: str, styles) -> Paragraph:
    return Paragraph(title, styles["SectionX"])


def subsection(title: str, styles) -> Paragraph:
    return Paragraph(title, styles["SubsectionX"])


def body(text: str, styles) -> Paragraph:
    return Paragraph(text, styles["BodyX"])


def bullets(items: Iterable[str], styles) -> ListFlowable:
    flowables = []
    for item in items:
        flowables.append(ListItem(Paragraph(item, styles["BulletX"]), leftIndent=8))
    return ListFlowable(
        flowables,
        bulletType="bullet",
        start="circle",
        leftIndent=12,
        bulletFontName="Helvetica",
        bulletFontSize=8,
        bulletOffsetY=2,
    )


def code_block(text: str, styles) -> Preformatted:
    return Preformatted(text.strip("\n"), styles["CodeX"])


def add_table(title: str, headers: list[str], rows: list[list[str]], styles, story: list) -> None:
    story.append(subsection(title, styles))
    data = [[Paragraph(f"<b>{h}</b>", styles["BodyX"]) for h in headers]]
    for row in rows:
        data.append([Paragraph(cell, styles["BodyX"]) for cell in row])
    table = Table(data, colWidths=[35 * mm, 40 * mm, 85 * mm], repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#103B66")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FBFE")]),
                ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#C7D7E6")),
                ("INNERGRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#D9E2EC")),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    story.append(table)
    story.append(Spacer(1, 4 * mm))


def build_pdf():
    styles = build_styles()
    story: list = []

    story += title_box(
        "TOCHI Legal Suite",
        "Exposicion tecnica del despliegue en Ubuntu 24.04 LTS sobre Google Cloud",
        styles,
    )
    story.append(Spacer(1, 8 * mm))

    story.append(
        make_kv_table(
            [
                ("Proyecto", "TOCHI Legal Suite"),
                ("Entorno", "VM Ubuntu 24.04 LTS en Google Compute Engine"),
                ("Servidor", "tochi-ubuntu"),
                ("Zona", "us-central1-a"),
                ("IP estatica", "34.58.5.145"),
                ("Dominios", "tochilegalsuite.online, www.tochilegalsuite.online y api.tochilegalsuite.online"),
                ("Base de datos", "MongoDB Atlas"),
                ("Fecha", date(2026, 5, 15).strftime("%d/%m/%Y")),
            ],
            styles,
        )
    )
    story.append(Spacer(1, 8 * mm))
    story.append(
        body(
            "Este documento resume de forma profesional la implementacion completa realizada para desplegar TOCHI Legal Suite sobre Ubuntu. "
            "Incluye la arquitectura final, los componentes instalados, la logica de funcionamiento y los pasos principales que se siguieron "
            "para dejar la aplicacion operativa en produccion.",
            styles,
        )
    )
    story.append(Spacer(1, 3 * mm))
    story.append(
        bullets(
            [
                "El frontend queda expuesto en www.tochilegalsuite.online.",
                "El backend queda expuesto en api.tochilegalsuite.online.",
                "La persistencia de datos se mantiene en MongoDB Atlas.",
                "Nginx actua como proxy reverso y Certbot habilita HTTPS.",
            ],
            styles,
        )
    )
    story.append(PageBreak())

    story.append(section("1. Resumen ejecutivo", styles))
    story.append(
        body(
            "TOCHI Legal Suite fue desplegado sobre una maquina virtual con Ubuntu 24.04 LTS en Google Cloud. "
            "La decision de usar Ubuntu responde a la necesidad de contar con un servidor controlado directamente, "
            "con configuracion personalizada de red, procesos persistentes y certificados SSL administrados de forma local. "
            "Sobre esta VM se instalo Node.js, Nginx, Git y Certbot, dejando la aplicacion lista para operar como un servicio profesional.",
            styles,
        )
    )
    story.append(
        body(
            "La aplicacion se organizo en dos capas independientes: un frontend para la interfaz de usuario y un backend para la logica del negocio, "
            "la autenticacion, la gestion documental y el acceso a servicios externos. Ambos servicios quedan administrados por systemd para que se "
            "reinicien automaticamente si la VM se reinicia o si alguno de los procesos falla.",
            styles,
        )
    )

    story.append(section("2. Objetivo de la solucion", styles))
    story.append(
        bullets(
            [
                "Publicar TOCHI en un servidor Ubuntu real, tal como suele pedirse en entornos academicos.",
                "Separar frontend y backend en dominios distintos para una arquitectura clara y ordenada.",
                "Mantener la base de datos en MongoDB Atlas para no depender del disco local de la VM.",
                "Asegurar disponibilidad, reinicio automatico y HTTPS con Nginx y Certbot.",
            ],
            styles,
        )
    )

    story.append(section("3. Arquitectura final", styles))
    add_table(
        "Mapa de componentes",
        ["Componente", "Funcion", "Detalle"],
        [
            ["Navegador", "Entrada del usuario", "Accede a la aplicacion mediante los dominios publicos."],
            ["DNS de Hostinger", "Resolucion de dominios", "Apunta los subdominios a la IP estatica de la VM."],
            ["Nginx", "Proxy reverso", "Recibe el trafico en 80 y 443 y lo distribuye al puerto correcto."],
            ["Frontend", "Interfaz", "Corre en el puerto 3000 y atiende www.tochilegalsuite.online."],
            ["Backend", "Logica de negocio", "Corre en el puerto 4000 y atiende api.tochilegalsuite.online."],
            ["MongoDB Atlas", "Persistencia", "Almacena usuarios, casos, documentos y demas registros."],
            ["systemd", "Supervision", "Mantiene servicios activos y los relanza automaticamente."],
        ],
        styles,
        story,
    )

    story.append(section("4. Infraestructura preparada", styles))
    story.append(
        make_kv_table(
            [
                ("VM", "tochi-ubuntu"),
                ("Tipo de maquina", "e2-medium"),
                ("Sistema operativo", "Ubuntu 24.04 LTS"),
                ("Disco de arranque", "Disco persistente balanceado de 30 GB"),
                ("Puerto SSH", "22"),
                ("Puerto HTTP", "80"),
                ("Puerto HTTPS", "443"),
                ("IP estatica", "34.58.5.145"),
            ],
            styles,
        )
    )
    story.append(Spacer(1, 4 * mm))
    story.append(
        body(
            "La VM fue creada en Google Compute Engine, con una IP estatica regional en us-central1 para garantizar que el dominio no cambie. "
            "Posteriormente se abrieron los puertos necesarios para administracion y publicacion web, y se dejo Ubuntu como sistema base para "
            "instalar el stack de produccion.",
            styles,
        )
    )

    story.append(section("5. Paso a paso de la implementacion", styles))
    story.append(
        bullets(
            [
                "Se creo una VM Ubuntu 24.04 LTS en Google Cloud con IP estatica.",
                "Se instalaron Git, curl, build-essential, Nginx y Node.js 20.",
                "Se clono el repositorio del proyecto dentro de /opt/tochi/TOCHI_LEGAL_SUITE.",
                "Se configuraron los archivos de entorno backend.env y frontend/.env.local con las URLs de produccion.",
                "Se corrigio un error de prerender en /checkout/success envolviendo useSearchParams dentro de Suspense.",
                "Se compilaron el backend y el frontend para produccion.",
                "Se instalaron los servicios systemd para que ambos procesos inicien automaticamente.",
                "Se configuro Nginx como proxy reverso para www, api y el dominio raiz.",
                "Se emitio un certificado SSL con Certbot y se dejo la renovacion automatica activa.",
            ],
            styles,
        )
    )

    story.append(section("6. Funcionamiento completo del sistema", styles))
    story.append(
        body(
            "El funcionamiento final es el siguiente: el usuario ingresa en el navegador a uno de los dominios publicados, el DNS de Hostinger resuelve "
            "la solicitud hacia la IP estatica de la VM y Nginx recibe la peticion. A partir de ahi, Nginx decide a que servicio enviar el trafico. "
            "Si la solicitud corresponde a www o al dominio raiz, se redirige al frontend; si corresponde a api, se redirige al backend.",
            styles,
        )
    )
    story.append(
        bullets(
            [
                "El frontend genera la interfaz, rutas y experiencia de usuario.",
                "El backend procesa autenticacion, gestion de casos, documentos, citas, comunicaciones y automatizaciones.",
                "El backend consulta y actualiza informacion en MongoDB Atlas.",
                "Las respuestas regresan al navegador a traves de Nginx con HTTPS.",
            ],
            styles,
        )
    )

    story.append(section("7. DNS y certificados", styles))
    add_table(
        "Registros publicos",
        ["Registro", "Destino", "Uso"],
        [
            ["A @", "34.58.5.145", "Dominio raiz"],
            ["A www", "34.58.5.145", "Frontend publico"],
            ["A api", "34.58.5.145", "Backend publico"],
        ],
        styles,
        story,
    )
    story.append(
        body(
            "Certbot emitio con exito un certificado para tochilegalsuite.online, www.tochilegalsuite.online y api.tochilegalsuite.online. "
            "Tambien dejo configurada la renovacion automatica, por lo que el sistema puede mantener HTTPS sin intervencion manual.",
            styles,
        )
    )

    story.append(section("8. Servicios de Linux que quedaron activos", styles))
    add_table(
        "Servicios systemd",
        ["Servicio", "Ruta", "Puerto"],
        [
            ["tochi-backend", "/etc/systemd/system/tochi-backend.service", "4000"],
            ["tochi-frontend", "/etc/systemd/system/tochi-frontend.service", "3000"],
            ["nginx", "/usr/lib/systemd/system/nginx.service", "80 / 443"],
        ],
        styles,
        story,
    )
    story.append(
        body(
            "La ventaja de systemd es que permite que los procesos se mantengan levantados sin depender de la sesion SSH. "
            "Si la VM se reinicia, systemd los vuelve a iniciar automaticamente gracias a la configuracion habilitada.",
            styles,
        )
    )

    story.append(section("9. Ajuste tecnico que resolvio el build", styles))
    story.append(
        body(
            "Durante el despliegue aparecio un error de Next.js en la pagina /checkout/success porque useSearchParams se estaba usando sin una "
            "frontera Suspense en un contexto de prerender. Para corregirlo, la logica se separo en un componente cliente y la pagina principal "
            "quedo como un componente de servidor con Suspense. Con ese ajuste, el build paso correctamente.",
            styles,
        )
    )

    story.append(section("10. Comandos principales ejecutados", styles))
    story.append(
        code_block(
            """
sudo apt update
sudo apt upgrade -y
sudo apt install -y git curl build-essential nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
git clone https://github.com/JHONCHITO/-TOCHI-Legal-Suite.git /opt/tochi/TOCHI_LEGAL_SUITE
sudo bash infrastructure/ubuntu/setup-ubuntu.sh
sudo certbot --nginx
  -d tochilegalsuite.online
  -d www.tochilegalsuite.online
  -d api.tochilegalsuite.online
            """,
            styles,
        )
    )
    story.append(
        body(
            "Nota: las credenciales y claves sensibles se conservaron en los archivos de entorno del servidor y no se incluyen en este informe por seguridad.",
            styles,
        )
    )

    story.append(PageBreak())
    story.append(section("11. Verificacion operacional", styles))
    story.append(
        bullets(
            [
                "systemctl status tochi-backend --no-pager",
                "systemctl status tochi-frontend --no-pager",
                "systemctl status nginx --no-pager",
                "curl -I https://tochilegalsuite.online",
                "curl -I https://www.tochilegalsuite.online",
                "curl -I https://api.tochilegalsuite.online",
            ],
            styles,
        )
    )
    story.append(
        body(
            "Con estas comprobaciones se valida que los procesos siguen activos, que Nginx responde y que los certificados estan instalados. "
            "Si alguno de los servicios falla, los registros pueden revisarse con journalctl -u nombre-del-servicio.",
            styles,
        )
    )

    story.append(section("12. Consideraciones finales", styles))
    story.append(
        bullets(
            [
                "Ubuntu es el sistema operativo del servidor, no la aplicacion en si.",
                "El uso de una VM da control completo sobre procesos, puertos, logs y configuraciones.",
                "MongoDB Atlas evita depender del disco local de la VM para los datos importantes.",
                "Nginx unifica la publicacion web y permite separar frontend y backend por subdominio.",
                "Certbot automatiza la seguridad con HTTPS y renovacion de certificados.",
            ],
            styles,
        )
    )

    story.append(section("13. Cierre para exposicion", styles))
    story.append(
        body(
            "En conclusion, TOCHI Legal Suite quedo desplegado sobre una infraestructura profesional en Ubuntu, con servicios persistentes, "
            "proxy reverso, certificados SSL y almacenamiento externo seguro. Esta solucion cumple con el objetivo academico de demostrar un "
            "despliegue real sobre Linux, y al mismo tiempo deja la aplicacion lista para operar de forma estable y escalable.",
            styles,
        )
    )
    story.append(
        body(
            "Si deseas exponerlo en clase, puedes resumirlo asi: se creo una VM Ubuntu en Google Cloud, se instalo el stack de produccion, "
            "se desplegaron frontend y backend como servicios independientes, se publico la aplicacion con Nginx y se aseguro el acceso con HTTPS. "
            "De esta forma, TOCHI no solo funciona, sino que tambien queda explicado y sustentado como una arquitectura profesional.",
            styles,
        )
    )

    doc = SimpleDocTemplate(
        str(OUTPUT_FILE),
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=24 * mm,
        bottomMargin=18 * mm,
        title="TOCHI Legal Suite - Exposicion Ubuntu",
        author="Codex",
    )
    doc.build(story, onFirstPage=page_decor, onLaterPages=page_decor)


if __name__ == "__main__":
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    build_pdf()
    print(OUTPUT_FILE)
