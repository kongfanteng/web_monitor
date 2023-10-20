import babal from 'rollup-plugin-babel';

export default {
  input: './index.js',
  output: {
    file: '../website/client/bundle.js',
    format: 'umd',
  },
  watch: {
    exclude: 'node_modules/**',
  },
  plugins: [
    babal({
      babelrc: false,
      presets: [
        '@babel/preset-env',
      ],
    }),
  ],
};
