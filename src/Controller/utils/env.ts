import { DataType, Json, Num } from './types/data-type.type';

const EnvIdentLib = [
  {
    Value: 'IOT_DATA',
    Desc: '预置变量,设备采集的数据',
    Type: DataType.JSON,
    Inspect() {
      return this.Value.toString();
    },
    getOrigin: () => {
      return new Json(null);
    },
  },
  {
    Value: 'IOT_DATA_TIME',
    Desc: '预置变量,设备采集数据入库时间',
    Type: DataType.NUMERIC,
    Inspect() {
      return this.Value.toString();
    },
    getOrigin: () => {
      return new Num(1);
    },
  },
];

export { EnvIdentLib };
