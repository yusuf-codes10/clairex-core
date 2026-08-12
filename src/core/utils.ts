export const matchRoute = (route: string, path: string): Record<string, string> | null => {
  const routeParts: string[] = route.split("/").filter(Boolean);
  const pathParts: string[] = path.split("/").filter(Boolean);

  if (routeParts.length !== pathParts.length) {
    return null;
  }

  const params: Record<string, string> = {};

  for (let i: number = 0; i < routeParts.length; i++) {
    const routePart: string | undefined = routeParts[i];
    const pathPart: string | undefined = pathParts[i];

    if (!routePart || !pathPart) return null;

    if (routePart.startsWith(":")) {
      params[routePart.slice(1)] = pathPart;
      continue;
    }

    if (routePart !== pathPart) {
      return null;
    }
  }

  return params;
};


export const clairexBanner = (port: number): void => {
  const purple: string = "\x1b[38;2;100;60;220m";
  const dim: string = "\x1b[2m";
  const reset: string = "\x1b[0m";

  const banner: string = `
${purple}   ╔══════════════════════════════════════════════════════╗
   ║                                                      ║
   ║    ██████╗ ██╗      █████╗ ██╗██████╗ ███████╗       ║
   ║   ██╔════╝ ██║     ██╔══██╗██║██╔══██╗██╔════╝       ║
   ║   ██║      ██║     ███████║██║██████╔╝█████╗         ║
   ║   ██║      ██║     ██╔══██║██║██╔══██╗██╔══╝         ║
   ║   ╚██████╗ ███████╗██║  ██║██║██║  ██║███████╗       ║
   ║    ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚══════╝       ║
   ║                                                      ║
   ║              ██╗  ██╗                                 ║
   ║              ╚██╗██╔╝                                 ║
   ║               ╚███╔╝                                  ║
   ║               ██╔██╗                                  ║
   ║              ██╔╝ ██╗                                 ║
   ║              ╚═╝  ╚═╝                                 ║
   ║                                                      ║
   ╚══════════════════════════════════════════════════════╝${reset}

${dim}   ⚡ ClaireX Framework${reset}
${dim}   ⚡ Running on port ${port}${reset}
${dim}   ⚡ Class-based • Bun-native • Explicitly typed${reset}
`;

  console.log(banner);
};
