import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";
  const query = q ? encodeURIComponent(q) : "";

  const resultados = [
    {
      fuente: "SUIN-Juriscol",
      titulo: "Buscar leyes y normas",
      link: query ? `https://www.suin-juriscol.gov.co/search?q=${query}` : "https://www.suin-juriscol.gov.co/",
    },
    {
      fuente: "Rama Judicial",
      titulo: "Consulta de procesos",
      link: "https://consultaprocesos.ramajudicial.gov.co/",
    },
    {
      fuente: "Senado",
      titulo: "Base de datos legal",
      link: "http://www.secretariasenado.gov.co/senado/basedoc/",
    },
    {
      fuente: "Corte Constitucional",
      titulo: "Jurisprudencia constitucional",
      link: "https://www.corteconstitucional.gov.co/relatoria/",
    },
    {
      fuente: "Corte Suprema",
      titulo: "Jurisprudencia Corte Suprema",
      link: "https://jurisprudencia.ramajudicial.gov.co/WebRelatoria/csj/index.html",
    },
    {
      fuente: "Consejo de Estado",
      titulo: "Jurisprudencia administrativa",
      link: "https://jurisprudencia.ramajudicial.gov.co/WebRelatoria/ce/index.xhtml",
    },
    {
      fuente: "Datos Abiertos",
      titulo: "Datos publicos legales",
      link: "https://www.datos.gov.co/",
    },
    {
      fuente: "Diario Oficial",
      titulo: "Publicacion de nuevas leyes",
      link: "https://www.imprenta.gov.co/",
    },
  ];

  return NextResponse.json(resultados);
}
