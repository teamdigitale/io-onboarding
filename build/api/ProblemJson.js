"use strict";
/**
 * Do not edit this file it is auto-generated by italia-utils / gen-api-models.
 * See https://github.com/teamdigitale/italia-utils
 */
/* tslint:disable */
Object.defineProperty(exports, "__esModule", { value: true });
const HttpStatusCode_1 = require("./HttpStatusCode");
const types_1 = require("italia-ts-commons/lib/types");
const t = require("io-ts");
// required attributes
const ProblemJsonR = t.interface({});
// optional attributes
const ProblemJsonO = t.partial({
    type: types_1.withDefault(t.string, "about:blank"),
    title: t.string,
    status: HttpStatusCode_1.HttpStatusCode,
    detail: t.string,
    instance: t.string
});
exports.ProblemJson = t.intersection([ProblemJsonR, ProblemJsonO], "ProblemJson");
//# sourceMappingURL=ProblemJson.js.map