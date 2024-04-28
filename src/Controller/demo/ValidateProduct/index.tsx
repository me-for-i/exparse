import { Input, } from 'antd';
import React, { useState, useEffect } from 'react';
import lexExp from '../../utils/contorllers/lexer';
import parseTokens from '../../utils/contorllers/parser';
import validateAst from '../../utils/contorllers/validator';
import { normalUseingBlock } from './styles';

const LexProduct: React.FC = () => {
  const [expression, setExpression] = useState<string>();
  const [errInfo, setErrInfo] = useState<{ Msg: string; Offset: number } | null>(null);

  useEffect(() => {
    if (!expression) {
      return;
    }
    let _errorInfo: { Msg: string; Offset: number } | null = null;

    const { tokens, errorInfo: lexErr } = lexExp({ exp: expression });
    _errorInfo = _errorInfo ?? lexErr
    const { ast, errorInfo: parseErr } = parseTokens({ tokens })
    _errorInfo = _errorInfo ?? parseErr
    if (ast) {
      const { isValid, errorInfo: validateErr } = validateAst({ ast })
      if (!isValid) {
        _errorInfo = _errorInfo ?? validateErr
      }
    }
    setErrInfo(_errorInfo)
  }, [expression]);

  return (
    <div className={normalUseingBlock}>
      <Input
        placeholder="输入表达式，形如 a + b / 2 - sum(1, 2, 3)"
        className={errInfo ? 'error-input' : ''}
        onChange={(e) => {
          setExpression(e.target.value);
        }}
      />
      {
        errInfo &&
        <div className='err-info'>{`${errInfo?.Msg}`}</div>
      }
      <div className="exp-parse-res">
        {`Valid? ${errInfo ? 'No' : 'Yes'}`}
      </div>
    </div>
  );
};

export default LexProduct;
