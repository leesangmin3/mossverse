import { Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Model, Types, Query, Schema as Sch } from "mongoose";
import { dbConfig, Id } from "@shared/util-server";
import { modules } from "@shared/module";
import { UserSchema, UserInput } from "./user.gql";
import * as gql from "../gql";
import { db as shared } from "@shared/module";
import { db as platform } from "@platform/module";
import { db as decentverse } from "@decentverse/server";
import { Utils } from "@shared/util";

@Schema(dbConfig.defaultSchemaOptions)
class User extends UserSchema {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface User extends shared.User.Raw, platform.User.Raw, decentverse.User.Raw {}
export const name = User.name;
export type Input = UserInput & shared.User.Input & platform.User.Input & decentverse.User.Input;
export type Raw = User & shared.User.Raw & platform.User.Raw & decentverse.User.Raw;
export interface DocType extends Document<Types.ObjectId, QryHelps, Raw>, DocMtds, Omit<Raw, "id"> {}
export type Doc = DocType &
  shared.User.DocType &
  platform.User.DocType &
  decentverse.User.DocType &
  dbConfig.DefaultSchemaFields;
export type Mdl = Model<Doc, QryHelps, DocMtds> & MdlStats & shared.User.Mdl & platform.User.Mdl & decentverse.User.Mdl;
const addSchema = SchemaFactory.createForClass<Raw, Doc>(User);
export const schema: Sch<null, Mdl, DocMtds, QryHelps, null, MdlStats> = shared.User.schema.add(addSchema) as any;
/**
 * * 5. 유틸리티 설계: 스키마를 손쉽게 사용할 유틸리티를 작성하세요.
 * ? 도큐먼트의 유틸리티를 위한 document method를 작성하세요.
 * ? 모델의 유틸리티를 위한 model statics를 작성하세요.
 * ? 모델의 유틸리티를 위한 query helpers를 작성하세요.
 */

// * 5. 1. Document Methods
interface DocMtds extends shared.User.DocMtds, platform.User.DocMtds, decentverse.User.DocMtds {
  dumb3: () => boolean;
}
schema.methods.dumb3 = function (this: Doc) {
  return true;
};

// * 5. 2. Model Statics
interface MdlStats extends shared.User.MdlStats, platform.User.MdlStats, decentverse.User.MdlStats {
  dumb: () => Promise<Doc>;
}
schema.statics.dumb = async function () {
  const doc = this.pickOne({});
  return doc;
};

// * 5. 3. Model Statics
interface QryHelps extends shared.User.QryHelps, platform.User.QryHelps, decentverse.User.QryHelps {
  dumb: () => Query<any, Doc, QryHelps> & QryHelps;
}
schema.query.dumb = function (this: Mdl) {
  return this.find({});
};

export const middleware = () => () => {
  /**
   * * 미들웨어 설계: 스키마 데이터 관리 시 사용할 미들웨어를 작성하세요.
   * ? save 시 자동으로 적용할 알고리즘을 적용하세요.
   */
  schema.pre<Doc>("save", async function (next) {
    next();
  });
  return schema;
};
