# Receitas: de onde vêm as imagens da Norte

Nenhuma imagem da Norte foi gerada por IA. O site tem duas fontes de imagem:

1. **O globo**, feito em código (Three.js) com dados públicos da NASA. As texturas já tratadas vêm prontas em `arquivos/public/textures/`.
2. **Duas fotos de banco** (Pexels, licença livre para uso comercial). Elas **vêm no pacote já tratadas**, em `arquivos/public/img/` (dez larguras). Os links abaixo servem para os créditos e para refazer o tratamento.

## Fotos de banco

| onde aparece | foto | autor | página da foto | download direto (2800 px) |
|---|---|---|---|---|
| Migração (mulher trabalhando à noite no balcão, luminária acesa) | Pexels 30215681 | Oktay Köseoğlu | https://www.pexels.com/photo/woman-working-late-at-night-on-laptop-30215681/ | https://images.pexels.com/photos/30215681/pexels-photo-30215681.jpeg?auto=compress&cs=tinysrgb&w=2800 |
| Suporte 24h (atendente de headset, luz quente) | Pexels 7709199 | MART PRODUCTION | https://www.pexels.com/photo/a-close-up-shot-of-a-woman-wearing-a-headset-7709199/ | https://images.pexels.com/photos/7709199/pexels-photo-7709199.jpeg?auto=compress&cs=tinysrgb&w=2800 |

Licença do Pexels: https://www.pexels.com/license/ (uso livre, comercial inclusive; não precisa dar crédito, mas é gentil; não venda a foto sozinha nem dê a entender que as pessoas da foto recomendam a sua marca).

**Para refazer o tratamento** (ou tratar fotos novas do mesmo jeito)
1. Salve as duas em `fonte/fotos/` com os nomes `pexels-30215681.jpg` e `pexels-7709199.jpg`.
2. Instale o que o script usa (`python3 -m pip install pillow numpy`) e rode, da raiz do projeto: `python3 arquivos/fonte/fotos.py`.
3. Ele gera em `public/img/` as larguras que a página usa (`migracao-1100/1800/2400.webp`, `migracao-vertical-800/1200.webp`, `suporte-1000/1600/2200.webp`, `suporte-vertical-800/1200.webp`).

O que o tratamento faz: tira o azul (as fotos de escritório puxam para o azul e o site é quente), esquenta as sombras, escurece as bordas e **iguala o preto da foto ao preto da página** (`#0e0d0c`), para a borda esfumada não mostrar emenda. Faz também os recortes verticais do celular.

**Com fotos suas**: troque os nomes de arquivo no script (`pexels-30215681.jpg` e `pexels-7709199.jpg`) e ajuste os recortes do celular (`crop`), se a pessoa estiver em outro ponto da foto. Sirva qualquer foto que seja **escura, com luz quente e fundo que cai no preto**. Sem Python, dá para converter as fotos para WebP em qualquer conversor (Squoosh, por exemplo): a página funciona, só fica um pouco mais fria.

## O globo (NASA, domínio público)

As texturas de `arquivos/public/textures/` já estão prontas:
- `terra-cor-4096.webp` e `terra-cor-2048.webp`: os continentes em cinza quente e o oceano grafite (tirados da **Blue Marble Next Generation** da NASA);
- `terra-relevo-4096.webp` e `terra-relevo-2048.webp`: o relevo (normal map, do **GEBCO 2008**) nos canais vermelho e verde e a máscara de água no azul.

Só precisa refazer se quiser **outras cores no globo**. Aí:
1. Baixe os três arquivos da NASA para `fonte/nasa/` (são grandes, 1,6 MB, 18 MB e 35 MB):
   - https://eoimages.gsfc.nasa.gov/images/imagerecords/74000/74393/world.topo.200407.3x5400x2700.jpg
   - https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73934/gebco_08_rev_elev_21600x10800.png
   - https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73963/gebco_08_rev_bath_21600x10800.png
2. Troque as cores do topo de `arquivos/fonte/texturas.py` (`TERRA_ESCURA`, `TERRA_CLARA`, `GELO`, `OCEANO`) e rode, da raiz do projeto, `python3 arquivos/fonte/texturas.py`.
3. As texturas novas saem em `public/textures/`.

Crédito pedido pela NASA (opcional num site comercial, mas bom de ter na página de créditos): "Imagens: NASA Visible Earth / NASA Earth Observatory".

## Regiões acesas

Os pontos que acendem no globo são a lista `<ol class="globo__regioes">` no `index.html` (latitude e longitude de cada um). Para a sua empresa, ponha onde ficam os seus servidores ou onde você atende. Mantenha pelo menos oito visíveis no hero (lado das Américas, ou mude os quadros-chave do globo em `src/motion/coreografia.js` para a sua região ficar de frente) e escolha em `data-voa` o ponto que voa até a busca: um que esteja de frente quando o globo sai pelo alto.
