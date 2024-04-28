import { css } from '@emotion/css';

export const normalUseingBlock = css`
  padding: 16px;

  .input-wrap{
    display: flex;

    .ant-btn{
      margin-left: 16px
    }
  }

  .error-input{
    &:hover{
      border-color: #c12c1f !important;
    }
    &:focus{
      border-color: #c12c1f !important;
      box-shadow: 0 0 0 2px rgba(193, 44, 31, 0.1) !important;
    }
  }

  .err-info{
    margin-top: 16px;
    color: #c12c1f;
    overflow: hidden;
  }

  .exp-parse-res-wrap{
    position: relative;

    .tokens-table{
      margin-left: 16px;
      width: 40%;
      position: absolute;
      top: 16px;
      right: 16px;

      .ant-table{
        border-radius: 6px !important;
        overflow: hidden;
      }
    }
  }

  .exp-parse-res {
    margin-top: 16px;
    padding: 16px;
    border: 1px solid #e4e9ec;
    background-color: rgb(44, 62, 80);
    border-radius: 6px;
    display: flex;
    height: 240px;
    overflow-y: auto;
    transition: all 0.3s;

    .react-json-view{
      width: 100%;
      font-family: inherit !important;
    }

  }
`;
