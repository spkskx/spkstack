const pragma =
  /^\s*(?:[*\s]*)(?:eslint(?:-disable|-enable)?\b|oxlint-(?:disable|enable)\b|prettier-ignore\b|oxfmt-ignore\b|@ts-(?:expect-error|ignore|nocheck|check)\b|[cv]8 ignore\b|istanbul ignore\b|@(?:vitest|jest)-environment\b|[#@]__(?:PURE|NO_SIDE_EFFECTS)__|global\s|\/\s*<reference\s)/;
const license = /SPDX-License-Identifier|\bcopyright\b|@license\b|\(c\)\s*\d{4}/i;
const issueOrRfc =
  /https?:\/\/\S+\/(?:issues|pull|pulls|merge_requests)\/\d+|https?:\/\/\S+\/browse\/[A-Z][A-Z0-9]+-\d+|\bRFC[ -]?\d+\b|rfc-editor\.org\/|datatracker\.ietf\.org\//i;

const contains = (outer, inner) =>
  outer.range[0] <= inner.range[0] && inner.range[1] <= outer.range[1];

const rule = {
  meta: {
    type: "problem",
    messages: {
      comment:
        "Comment outside the keep list in docs/no-comments.md. Rename, extract, or retype the code instead.",
    },
    schema: [],
  },
  create(context) {
    const sourceCode = context.sourceCode;
    const exported = [];
    const members = [];
    const member = (node) => {
      members.push(node);
    };
    return {
      ExportNamedDeclaration(node) {
        exported.push(node);
      },
      ExportDefaultDeclaration(node) {
        exported.push(node);
      },
      MethodDefinition: member,
      PropertyDefinition: member,
      TSPropertySignature: member,
      TSMethodSignature: member,
      TSEnumMember: member,
      "Program:exit"(program) {
        const firstToken = sourceCode.getFirstToken(program);
        const headerEnd = firstToken ? firstToken.range[0] : Number.POSITIVE_INFINITY;
        const docs = new Set();
        const publicMembers = members.filter((node) => exported.some((e) => contains(e, node)));
        for (const node of [...exported, ...publicMembers]) {
          const before = sourceCode.getCommentsBefore(node);
          const last = before.at(-1);
          if (last && last.type === "Block" && last.value.startsWith("*")) {
            docs.add(last);
          }
        }
        for (const comment of sourceCode.getAllComments()) {
          const keep =
            pragma.test(comment.value) ||
            issueOrRfc.test(comment.value) ||
            docs.has(comment) ||
            (comment.range[1] <= headerEnd && license.test(comment.value));
          if (!keep) {
            context.report({ loc: comment.loc, messageId: "comment" });
          }
        }
      },
    };
  },
};

export default {
  meta: { name: "spkstack" },
  rules: { "no-comments": rule },
};
