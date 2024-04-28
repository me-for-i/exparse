module.exports = {
  env: {
    browser: true,
    // es2021: true,
  },
  rules: {
    'no-case-declarations': 0,
  },
  extends: require.resolve('@umijs/lint/dist/config/eslint'),
};
