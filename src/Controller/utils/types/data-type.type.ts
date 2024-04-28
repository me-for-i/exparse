export enum DataType {
  STRING = 'string',
  NUMERIC = 'numeric',
  BOOLEAN = 'boolean',
  BYTE = 'byte',
  BYTE_ARRAY = '[]byte',
  JSON = 'json',
  OBJECT = 'object',
  ERROR = 'error',
  NULL = 'null',
  LIB_FUNCTION = 'lib_function',
}

export interface DataObj {
  Type: string | boolean;
  Value?: any;
  Offset?: number;
  Inspect: () => string | boolean;
  [props: string]: any;
}

export interface Param {
  index: number;
  type: string;
  name: string;
}

export interface Func {
  name: string;
  description: string;
  tag: string;
  returnType: string;
  params: Param[];
  uncertainParam?: boolean;
}

export class Num {
  Value: number;
  Offset: number;
  constructor(value: number, offset?: number) {
    this.Value = value;
    this.Offset = offset ? offset : 0;
  }
  Type = DataType.NUMERIC;
  Inspect = () => this.Value.toString();
}

export class Str {
  Value: string;
  Offset: number;
  constructor(value: string, offset?: number) {
    this.Value = value;
    this.Offset = offset ? offset : 0;
  }
  Type = DataType.STRING;
  Inspect = () => this.Value.toString();
}

export class Bool {
  Value: boolean;
  Offset: number;
  constructor(value: boolean, offset?: number) {
    this.Value = value;
    this.Offset = offset ? offset : 0;
  }
  Type = DataType.BOOLEAN;
  Inspect = () => this.Value.toString();
}

export class Null {
  Offset: number;
  constructor(offset: number) {
    this.Offset = offset;
  }
  Type = DataType.NULL;
  Inspect = () => DataType.NULL;
}

export class LibFunc {
  Name: string;
  Description: string;
  Tag: string;
  ReturnType: string;
  Params: Param[];
  UncertainParam: boolean = false;
  Offset: number;
  constructor(
    config: {
      name: string;
      description: string;
      tag: string;
      returnType: string;
      params: Param[];
      uncertainParam?: boolean;
    },
    offset: number,
  ) {
    const { name, description, tag, returnType, params, uncertainParam } = config;

    this.Name = name;
    this.Description = description;
    this.Tag = tag;
    this.ReturnType = returnType;
    this.Params = params;
    if (uncertainParam !== undefined) {
      this.UncertainParam = uncertainParam
    }
    this.Offset = offset;
  }
  Type = DataType.LIB_FUNCTION;
  Inspect = () => '';
}

export class ByteArr {
  Value: Array<any>;
  Offset: number;
  constructor(value: Array<any>, offset?: number) {
    this.Value = value;
    this.Offset = offset ? offset : 0;
  }
  Type = DataType.BYTE_ARRAY;
  Inspect = () => this.Value.toString();
}

export class Json {
  Value: any;
  Offset: number;
  constructor(value: any, offset?: number) {
    this.Value = value;
    this.Offset = offset ? offset : 0;
  }
  Type = DataType.JSON;
  Inspect = () => this.Value;
}

export class Err {
  Msg: string;
  Offset: number;
  constructor(msg: string, offset?: number) {
    this.Msg = msg;
    this.Offset = offset ? offset : 0;
  }
  Type = DataType.ERROR;
  Inspect = () => this.Msg;
}

export class TrueObj {
  Value: boolean = true;
  Offset: number;
  constructor(offset: number) {
    this.Offset = offset ? offset : 0;
  }
  Type = DataType.BOOLEAN;
  Inspect = () => true;
}

export class FalseObj {
  Value: boolean = false;
  Offset: number;
  constructor(offset: number) {
    this.Offset = offset ? offset : 0;
  }
  Type = DataType.BOOLEAN;
  Inspect = () => false;
}
