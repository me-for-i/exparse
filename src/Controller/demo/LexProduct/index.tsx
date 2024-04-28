import { Input, Table } from 'antd';
import React, { useMemo, useState } from 'react';
import Highlighter from '../../utils/contorllers/heighlighter';
import lexExp from '../../utils/contorllers/lexer';
import { normalUseingBlock } from './styles';

const LexProduct: React.FC = () => {
  const [expression, setExpression] = useState<string>();
  const [errInfo, setErrInfo] = useState<{ Msg: string; Offset: number } | null>(null);

  const columns = [
    {
      title: 'Literal',
      dataIndex: 'Literal',
    },
    {
      title: 'Kind',
      dataIndex: 'Kind',
    },
    {
      title: 'Offset',
      dataIndex: 'Offset',
    },
  ];

  const dataSource = useMemo(() => {
    if (!expression) {
      return;
    }
    const { tokens, errorInfo } = lexExp({ exp: expression });
    setErrInfo(errorInfo);
    const styleExp = new Highlighter().heighLighting({ tokens });
    const styleExpEl = document.getElementById('style-exp');
    if (styleExpEl) {
      styleExpEl.innerHTML = styleExp;
    }
    return tokens.map((token) => ({
      ...token,
      key: Math.random().toString(12),
    }));
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
        <div id="style-exp" />
        <Table
          size="small"
          columns={columns}
          dataSource={dataSource}
          scroll={{ y: 200 }}
          pagination={false}
          className="tokens-table"
        />
      </div>
    </div>
  );
};

export default LexProduct;
