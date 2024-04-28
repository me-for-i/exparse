import { NodeType } from '../types/ast.type';
import { Validator, ValidatorConfig } from '../types/controller.type';
import {
  Bool,
  ByteArr,
  DataObj,
  DataType,
  Err,
  FalseObj,
  Func,
  Json,
  LibFunc,
  Null,
  Num,
  Str,
  TrueObj,
} from '../types/data-type.type';
import { Error, Expression, Token } from '../types/token.type';

class ExpValidator implements Validator {
  Exp: string = '';
  Err: Error | null = null;
  ast: Expression | null = null;

  notCheckIdent: boolean = false;
  presetKeywords: DataObj[] = [];
  presetFunctions: Record<string, Func> = {};

  // 静态成员存储函数库与全局的限定标识符
  static Functions: Record<string, any> = {};

  constructor(ast: Expression) {
    this.ast = ast ?? null;
  }

  // 语法验证config
  /**
   * @param config a object with these memeber
   * @param {boolean} config.notCheckIdent 是否不对 ident 做预置关键字匹配,直接视作 Num 处理
   * @param {DataObj[]} config.presetKeywords 预置关键字,ast 中的 node 需要查询是否是预置关键字以决定该 node 是以何种 type 参与计算的
   * @param {Record<string, Func>} config.presetFunctions 预置函数库,函数类型的 node 在预置函数库中存在时需要根据该函数的定义进一步得到函数的参数与返回值以判断计算是否出错
   * @example
   * 以下为默认配置
   * validate({
   *  notCheckIdent: false,
   *  presetKeywords: [],
   *  presetFunctions: {},
   * })
   * @returns Token[]
   */
  validate(config?: ValidatorConfig) {
    if (config) {
      for (let prop in config) {
        if (Object.hasOwn(config, prop)) {
          (this as ValidatorConfig)[prop] = config[prop];
        }
      }
    }

    if (!this.ast) {
      return this.newError('No valid ast', -1);
    }
    const res = this.eval(this.ast);

    if (res.Type === DataType.ERROR) {
      return res;
    }
    return res.Type === DataType.NUMERIC
      ? res
      : this.newError('The expression return value must be numeric', -1);
  }

  eval = (node: Expression): DataObj => {
    switch (node.NodeType) {
      case NodeType.NumericLiteral:
        return new Num(node.Value, node.Token.Offset);

      case NodeType.StringLiteral:
        return new Str(node.Value, node.Token.Offset);

      case NodeType.Boolean:
        return this.nativeBoolToBooleanObject(node.Value, node.Token.Offset);

      case NodeType.Identifier:
        return this.evalIdentifier(node);

      case NodeType.Function:
        return this.evalFunction(node);

      case NodeType.PrefixExpression:
        const right_prefix = this.eval(node.Right as Expression);
        if (this.isError(right_prefix)) return right_prefix;
        return this.evalPrefixExpression(node.Token!, right_prefix);

      case NodeType.InfixExpression:
        const left_infix = this.eval(node.Left as Expression);
        if (this.isError(left_infix)) return left_infix;
        const right_infix = this.eval(node.Right as Expression);
        if (this.isError(right_infix)) return right_infix;
        return this.evalInfixExpression(node!.Token, left_infix, right_infix);

      case NodeType.CallExpression:
        const func = this.eval(node.Function!);
        if (this.isError(func)) return func;
        const args = this.evalExpressions(node.Arguments!);
        if (args.length === 1 && this.isError(args[0])) return args[0];
        return this.applyFunction(func, args);

      default:
        return new Null(node.Token.Offset);
    }
  };

  nativeBoolToBooleanObject = (input: boolean, offset: number) => {
    return input ? new TrueObj(offset) : new FalseObj(offset);
  };

  evalBangOperatorExpressioin = (right: DataObj): DataObj => {
    if (right instanceof FalseObj || right instanceof Null) {
      return new TrueObj(right.Offset!);
    } else {
      return new FalseObj(right.Offset!);
    }
  };

  evalMinusPrefixOperatorExpressioin = (right: DataObj): DataObj => {
    if (right.Type !== DataType.NUMERIC) {
      return this.newError(`Unknown operator -${right.Type}`, right.Offset!);
    }
    return new Num(1);
  };

  evalPrefixExpression = (operator: Token, right: DataObj): DataObj => {
    switch (operator.Literal) {
      case '!':
        return this.evalBangOperatorExpressioin(right);
      case '-':
        return this.evalMinusPrefixOperatorExpressioin(right);
      default:
        return this.newError(
          `Unknown operator: ${operator.Literal}${
            right.Type
          }, please check position(${operator.Offset!})`,
          operator.Offset!,
        );
    }
  };

  evalIdentifier = (node: Expression): DataObj => {
    if (this.notCheckIdent) {
      return new Num(1);
    }
    const ident = this.presetKeywords.find((item) => item.Value === node.Value);
    if (ident && !this.isError(ident)) return ident.getOrigin();
    return this.newError(
      `Identifier not found: ${node.Value}, please check position(${node.Token.Offset})`,
      node.Token.Offset,
    );
  };

  evalFunction = (node: Expression): DataObj => {
    const builtin = this.presetFunctions[node.Value];
    if (builtin) {
      return new LibFunc(builtin, node.Token.Offset);
    }

    return this.newError(
      `Function not found: ${node.Value},please check position(${node.Token.Offset})`,
      node.Token.Offset,
    );
  };

  evalNumericInfixExpression = (
    operator: string,
    left: DataObj,
    right: DataObj,
  ): DataObj => {
    switch (operator) {
      case '+':
      case '-':
      case '*':
      case '/':
        return new Num(1, left.Offset!);
      case '>':
      case '<':
      case '>=':
      case '<=':
      case '==':
      case '!=':
        return this.nativeBoolToBooleanObject(true, left.Offset!);
      default:
        return this.newError(
          `Unknown operator: ${left.Type} ${operator} ${
            right.Type
          },please check position(${left.Offset!})`,
          left.Offset,
        );
    }
  };

  evalStringInfixExpression = (
    operator: string,
    left: DataObj,
    right: DataObj,
  ): DataObj => {
    switch (operator) {
      case '+':
        return new Str('', left.Offset!);
      case '>':
      case '<':
      case '>=':
      case '<=':
      case '==':
      case '!=':
        return this.nativeBoolToBooleanObject(true, left.Offset!);
      default:
        return this.newError(
          `Unknown operator: ${left.Type} ${operator} ${
            right.Type
          },please check position(${left.Offset!})`,
          left.Offset!,
        );
    }
  };

  evalInfixExpression = (
    operator: Token,
    left: DataObj,
    right: DataObj,
  ): DataObj => {
    switch (true) {
      case left.Type === DataType.NUMERIC && right.Type === DataType.NUMERIC:
        return this.evalNumericInfixExpression(operator.Literal, left, right);
      case left.Type === DataType.STRING && right.Type === DataType.STRING:
        return this.evalStringInfixExpression(operator.Literal, left, right);
      case operator.Literal === '==':
      case operator.Literal === '!=':
        return this.nativeBoolToBooleanObject(true, left.Offset!);
      case left.Type !== right.Type:
        return this.newError(
          `Type mismatch: ${left.Type} ${operator.Literal} ${
            right.Type
          },please check position(${operator.Offset!})`,
          operator.Offset!,
        );
      default:
        return this.newError(
          `Unknown operator: ${left.Type} ${operator} ${
            right.Type
          },please check position(${operator.Offset!})`,
          operator.Offset!,
        );
    }
  };

  evalExpressions = (exps: Expression[]): DataObj[] => {
    let errFlag = false;
    const results = exps.reduce((value, item) => {
      if (!errFlag) {
        const evaluated = this.eval(item);
        if (this.isError(evaluated)) {
          errFlag = true;
        }
        value.push(evaluated);
      }
      return value;
    }, [] as DataObj[]);
    return results;
  };

  applyFunction = (fn: DataObj, args: DataObj[]): DataObj => {
    if (!(fn instanceof LibFunc)) {
      return this.newError(`Not a function: ${fn.Type}`, fn.Offset!);
    }

    for (let index in args) {
      if (args[index].Type === DataType.ERROR) return args[index];
    }

    if (!fn.UncertainParam) {
      if (args.length !== fn.Params.length) {
        return this.newError(
          `${fn.Params.length} parameters need, but ${
            args.length
          } found, please check position(${fn.Offset + 1})`,
          fn.Offset,
        );
      }
      for (let index in fn.Params) {
        if (fn.Params[index].type !== args[index].Type) {
          return this.newError(
            `${fn.Params[index].type} type parameter need, but get  ${
              args[index].Type
            }  type, please check position (${
              args[index].Offset! - args[index].Value.length
            })`,
            fn.Offset,
          );
        }
      }
    }
    return this.getObjectFromType(fn);
  };

  getObjectFromType = (fn: DataObj): DataObj => {
    switch (fn.ReturnType) {
      case DataType.NUMERIC:
        return new Num(1, fn.Offset!);
      case DataType.STRING:
        return new Str('', fn.Offset!);
      case DataType.BOOLEAN:
        return new Bool(false, fn.Offset!);
      case DataType.JSON:
        return new Json(null, fn.Offset!);
      case DataType.BYTE_ARRAY:
        return new ByteArr([], fn.Offset!);
      default:
        return this.newError(
          `Unsupported data type ${
            fn.ReturnType
          }, please check position(${fn.Offset!})`,
          fn.Offset!,
        );
    }
  };

  newError = (msg: string, offset?: number) => new Err(msg, offset);

  isError = (obj: DataObj): boolean => obj?.Type === DataType.ERROR;
}

export default function validateAst({
  ast,
  validatorConfig,
}: {
  ast: Expression;
  validatorConfig?: ValidatorConfig;
}) {
  const validtor = new ExpValidator(ast);
  const res = validtor.validate(validatorConfig);
  return {
    errorInfo: { Msg: res.Msg, Offset: res.Offset ?? -1 },
    isValid: res.Type !== DataType.ERROR,
  };
}
