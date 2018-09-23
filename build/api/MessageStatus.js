"use strict";
/**
 * Do not edit this file it is auto-generated by italia-utils / gen-api-models.
 * See https://github.com/teamdigitale/italia-utils
 */
/* tslint:disable */
Object.defineProperty(exports, "__esModule", { value: true });
const MessageStatusValue_1 = require("./MessageStatusValue");
const Timestamp_1 = require("./Timestamp");
const t = require("io-ts");
// required attributes
const MessageStatusR = t.interface({
    status: MessageStatusValue_1.MessageStatusValue,
    updated_at: Timestamp_1.Timestamp
});
// optional attributes
const MessageStatusO = t.partial({
    version: t.Integer
});
exports.MessageStatus = t.intersection([MessageStatusR, MessageStatusO], "MessageStatus");
//# sourceMappingURL=MessageStatus.js.map