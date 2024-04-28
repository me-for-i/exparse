import { Input } from 'antd';
import React, { useState } from 'react';
import { } from '../../utils/contorllers/validator';
import { normalUseingBlock } from './styles';

const GeneralApp: React.FC = () => {

  const [expression, setExpression] = useState<string>();

  return (
    <div className={normalUseingBlock}>
      <Input
        placeholder='输入表达式，形如 a + b / 2'
        onChange={(e) => {
          setExpression(e.target.value);
        }}
      />
      <div className='exp_parse_res'>{expression}</div>
    </div>
  );
};

export default GeneralApp;
