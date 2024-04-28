import { css } from '@emotion/css';

export const normalUseingBlock = css`
  padding: 16px;

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

  .exp-parse-res {
    margin-top: 16px;
    padding: 16px;
    border: 1px solid #e4e9ec;
    border-radius: 6px;
    font-size: 60px;
  }
`;
