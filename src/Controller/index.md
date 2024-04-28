<!-- # Controller -->

## Lexer

Lexer 试图将一般的 exp 做词法解析,exp 会被拆分成不同的 Token, 由 Lexer 得到的产物可以用于后续的语法解析,除此之外也可以在最终的 exp 展示时根据 Token 的 Kind 使用不同的颜色实现高亮效果

<code src="./demo/LexProduct"></code>

### Props

| 参数      | 说明                 | 类型                        | 默认值 |
| --------- | -------------------- | --------------------------- | ------ |
| exp       | 待解析的表达式字符串 | string                      | 必填   |
| lexConfig | 解析时的配置         | [LexerConfig](#lexerconfig) | 可选   |

#### LexerConfig

| 参数                | 说明                                                                                                                                                                         | 类型    | 默认值                   |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------ |
| allowChineseAsIdent | 是否允许将中文解析为 [ident](#ident)                                                                                                                                         | boolean | false                    |
| allowEmptyString    | 允许出现空字符串,字符串为空时不会引发错误                                                                                                                                    | boolean | false                    |
| identBoundarySymbol | 使用此字符作为 [ident](#ident) 边界,暂时只支持一位字符                                                                                                                       | string  | $                        |
| identRegExp         | ident 中仅允许出现此 RegExp 所匹配的内容,若使用自定义的限制内容,则对应的报错提示不再给出限制内容的对应描述,仅提示出现限制内容外的字符,不具备根据正则表达式给出合适描述的能力 | RegExp  | /^(\w&#124;\.&#124;-)+$/ |

#### Ident

ident 可以理解为参数,格式为由指定字符包裹的字符传,默认使用的字符是$,例如可以输入`$params1$+2`,`param1` 就会被识别为一个 ident,其Token 类型为 NUMERIC. 使用这一特性可以实现便于理解的自然表达式,例如`薪水 - 苹果单价 * 购买数量` 可被编码为 `$salary$ - $apple.price$ \* $apple.count$ `,前提是需要做好 ident 与 name 的对应关系

## Parser

Parser 会使用 lex 阶段的产物 Tokens 生成 AST
<code src="./demo/ParseProduct"></code>

### Props

| 参数        | 说明                        | 类型                          | 默认值 |
| ----------- | --------------------------- | ----------------------------- | ------ |
| tokens      | 词法分析的产出,用以构建 ast | Token[ ]                      | 必填   |
| parseConfig | 解析时的配置                | [ParserConfig](#parserConfig) | 可选   |

#### ParserConfig

| 参数                | 说明                                                      | 类型   | 默认值 |
| ------------------- | --------------------------------------------------------- | ------ | ------ |
| identBoundarySymbol | 使用此字符作为 [ident](#ident) 边界,应与 lex 配置保持一致 | string | $      |

## Validator

Validator 可以对 AST 做运算结果的验证,若能计算得到一个数字类型的结果,那么认为当前输入的表达式是合法的.

<code src="./demo/ValidateProduct"></code>

### Props

| 参数        | 说明                                            | 类型                                | 默认值 |
| ----------- | ----------------------------------------------- | ----------------------------------- | ------ |
| ast         | 语法分析的产出,用以验证表达式的运算逻辑是否正确 | Expression                          | 必填   |
| parseConfig | 解析时的配置                                    | [ValidatorConfig](#validatorConfig) | 可选   |

#### ValidatorConfig

| 参数            | 说明                                                                                                              | 类型                          | 默认值 |
| --------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------- | ------ |
| notCheckIdent   | 是否不对 ident 做预置关键字匹配,直接视作 Num 处理                                                                 | boolean                       | false  |
| presetKeywords  | 预置关键字,ast 中的 node 需要查询是否是预置关键字以决定该 node 是以何种 type 参与计算的                           | [DataObj](#dataObj)[]         | []     |
| presetFunctions | 预置函数库,函数类型的 node 在预置函数库中存在时需要根据该函数的定义进一步得到函数的参数与返回值以判断计算是否出错 | Record<string, [Func](#func)> | {}     |
