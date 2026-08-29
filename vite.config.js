import { defineConfig } from 'vite';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        inicio: resolve(import.meta.dirname, 'index.html'),
        rastreio: resolve(import.meta.dirname, 'rastreio.html'),
        favoritos: resolve(import.meta.dirname, 'favoritos.html'),
        ajuda: resolve(import.meta.dirname, 'ajuda.html'),
        login: resolve(import.meta.dirname, 'login.html'),
        cadastro: resolve(import.meta.dirname, 'register.html'),
        conta: resolve(import.meta.dirname, 'minha-conta.html'),
        pedidos: resolve(import.meta.dirname, 'meus-pedidos.html'),
        carrinho: resolve(import.meta.dirname, 'carrinho.html'),
        esqueciSenha: resolve(import.meta.dirname, 'esqueci-senha.html'),
        resetarSenha: resolve(import.meta.dirname, 'resetar-senha.html'),
        termos: resolve(import.meta.dirname, 'termos.html')
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  plugins: [
    ViteImageOptimizer({
      jpg: { quality: 75 },
      jpeg: { quality: 75 },
      png: { quality: 75 },
      webp: { quality: 75 }
    })
  ]
});
