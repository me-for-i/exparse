import { Input, Table, Button } from 'antd';
import React, { useState, useMemo } from 'react';
import ReactJson from 'react-json-view';
import lexExp from '../../utils/contorllers/lexer';
import parseTokens from '../../utils/contorllers/parser';
import { normalUseingBlock } from './styles';

const LexProduct: React.FC = () => {
  const [expression, setExpression] = useState<string>();
  const [astObject, setAstObject] = useState<Record<string, any> | null>(null);
  const [errInfo, setErrInfo] = useState<{ Msg: string; Offset: number } | null>(null);
  const [showTokens, setShowTokens] = useState<boolean>(false);

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
    const { tokens } = lexExp({ exp: expression });
    const { ast, errorInfo } = parseTokens({ tokens })
    setAstObject(ast);
    setErrInfo(errorInfo);
    return tokens.map((token) => ({
      ...token,
      key: Math.random().toString(12),
    }));
  }, [expression]);

  return (
    <div className={normalUseingBlock}>
      <div className='input-wrap'>
        <Input
          placeholder="输入表达式，形如 a + b / 2 - sum(1, 2, 3)"
          className={errInfo ? 'error-input' : ''}
          onChange={(e) => {
            setExpression(e.target.value);
          }}
        />
        <Button
          onClick={() => {
            setShowTokens(pre => !pre)
          }}
        >
          {
            showTokens ? 'HideTokens' : 'ShowTokens'
          }
        </Button>
      </div>
      {
        errInfo &&
        <div className='err-info'>{`${errInfo?.Msg}`}</div>
      }
      <div className="exp-parse-res-wrap">
        <div className="exp-parse-res">
          <div className='json-view'>
            {astObject &&
              <ReactJson
                src={astObject}
                // theme='rjv-default'
                theme='flat'
                iconStyle='circle'
                displayDataTypes={false}
              />
            }
          </div>
        </div>
        {
          showTokens &&
          <Table
            size="small"
            columns={columns}
            dataSource={dataSource}
            scroll={{ y: 200 }}
            pagination={false}
            className="tokens-table"
          />
        }
      </div>
    </div>
  );
};

export default LexProduct;
