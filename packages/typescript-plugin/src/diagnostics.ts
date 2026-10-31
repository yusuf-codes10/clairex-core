// import type * as ts from "typescript/lib/tsserverlibrary";

// export function missingReturnTypes(
//   tsModule: typeof ts,
//   sourceFile: ts.SourceFile
// ): ts.Diagnostic[] {
//   const out: ts.Diagnostic[] = [];

//   const visit = (node: ts.Node): void => {
//     const isCheckedKind =
//       tsModule.isMethodDeclaration(node) ||
//       tsModule.isFunctionDeclaration(node);

//     // has a body (so not an overload/abstract) but no ": Type" annotation
//     if (isCheckedKind && node.body && !node.type) {
//       const target = node.name ?? node;
//       out.push({
//         file: sourceFile,
//         start: target.getStart(sourceFile),
//         length: target.getWidth(sourceFile),
//         messageText: "ClaireX: this method is missing a return type.",
//         category: tsModule.DiagnosticCategory.Error, // Warning = yellow squiggle
//         code: 90001,
//         source: "clairex",
//       });
//     }
//     tsModule.forEachChild(node, visit);
//   };

//   visit(sourceFile);
//   return out;
// }


import type * as ts from "typescript/lib/tsserverlibrary";
import { check } from "@clairex/rules";

export function claireDiagnostics(tsModule: typeof ts, sf: ts.SourceFile): ts.Diagnostic[] {
  return check(tsModule, sf).map((v) => ({
    file: sf,
    start: v.start,
    length: v.length,
    messageText: `ClaireX: ${v.message}`,
    category:
      v.severity === "warning"
        ? tsModule.DiagnosticCategory.Warning
        : tsModule.DiagnosticCategory.Error,
    code: 90001,
    source: "clairex",
  }));
}