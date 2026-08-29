/*======================= Barra de Pesquisa com Filtro =====================*/
export function search() {
  // 1- Acessando os elementos do HTML
  const input = document.querySelector("#search");
  const form = document.querySelector(".search-container form");
  const resultsList = document.querySelector("#search-results");
  const searchContainer = document.querySelector(".search-container");

  // 2- Estado/CONTROLE DO ITEM ATIVO (SETAS ↑ ↓)
  let activeIndex = -1; //nenhum selecionado

  // 3- PEGAR TODO O TEXTO DA PÁGINA
  const elementos = Array.from(document.querySelectorAll("li, p, h1, h2, h3"));

  // 4- Evento: quando o usuário aperta ENTER
  form.addEventListener("submit", e => {
    e.preventDefault(); //Impede o formulário de recarregar a página

    const firstResult = resultsList.querySelector("li");

    if (!firstResult) return; //Se não existir resultado → não faz nada
    firstResult.click(); //Simula um clique no primeiro resultado
  });
  // 5- Função para padronizar texto(ACENTOS)
  function normalize(text) {
    return text
      .toLowerCase()      //tudo minúsculo
      .normalize("NFD")   //separa letras dos acentos
      .replace(/[\u0300-\u036f]/g, ""); //remove os acentos
  }
  // 6- Função para remover marcações
  function clearHighlights() {
    //Remove <span class="search-highlight">
    elementos.forEach(el => {        
      el.innerHTML = el.textContent;
    });
  }
  // 7- Função para Marca o texto encontrado com <span>
  function highlightElement(el, termoNormalizado) {
    //Ele caminha por cada pedaço de texto
    const walker = document.createTreeWalker(el,
      NodeFilter.SHOW_TEXT, //Quando o usuário estiver andando pelo HTML, mostra APENAS os textos e ignora as tags.
      null //O null significa: Aceite todos os nós de texto.
    );
    //8- Loop enquanto houver texto
    while (walker.nextNode()) {
      const textNode = walker.currentNode;
      // Texto real + texto normalizado
      const originalText = textNode.textContent;
      const normalizedText = normalize(originalText);
      // Se não encontrou → pula
      const index = normalizedText.indexOf(termoNormalizado);

      if (index === -1) continue;

      // Cria uma “seleção invisível”
      const range = document.createRange();
      // Seleciona exatamente o trecho encontrado

      range.setStart(textNode, index);
      range.setEnd(textNode, index + termoNormalizado.length);
      // Cria o destaque
      const span = document.createElement("span");

      span.className = "search-highlight";
      //Marca apenas a primeira ocorrência
      range.surroundContents(span);
      return;
    }
      
  }
  // 9-ATUALIZAR ITEM ATIVO (SETAS)/Atualiza visualmente qual item está ativo
  function updateActiveItem() {
    const items = resultsList.querySelectorAll("li");
    //Se for o ativo → adiciona classe. Se não → remove
    items.forEach((li, index) => {
      li.classList.toggle("active", index === activeIndex);
    });
    //Faz a lista rolar automaticamente
    if (items[activeIndex]) {
      items[activeIndex].scrollIntoView({
        block: "nearest"
      });
    }
  }
  // 10-BUSCA AO DIGITAR.Evento: cada letra digitada
  input.addEventListener("input", () => {
    const termo = normalize(input.value); // Pega o texto digitado e normaliza
    //Limpa tudo antes da nova busca
    resultsList.innerHTML = "";
    activeIndex = -1; 
    clearHighlights();
    //Se input vazio → para
    if (!termo) return;

    elementos.forEach(el => {
      const textoNormalizado = normalize(el.textContent);
      // Verifica se o texto contém o termo

      if (textoNormalizado.includes(termo)) {
        //Cria um item de resultado

        const li = document.createElement("li");

        li.textContent = el.textContent.slice(0, 50) + "...";
        //Clique leva até o texto na página

        li.addEventListener("click", () => {
          el.scrollIntoView({
            behavior: "smooth",
            block: "center"
          });
        });

        resultsList.appendChild(li);
        highlightElement(el, termo); //Marca o texto encontrado
      }
    });
  });
  //11-NAVEGAÇÃO PELO TECLADO.Detecta teclas pressionadas
  input.addEventListener("keydown", e => {
    const items = resultsList.querySelectorAll("li");
    if (!items.length) return;
    //Avança na lista
    if (e.key === "ArrowDown") {
      e.preventDefault();
      //Volta na lista
      activeIndex = (activeIndex + 1) % items.length;
      updateActiveItem();
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      activeIndex =
        (activeIndex - 1 + items.length) % items.length;
      updateActiveItem();
    }
  
    if (e.key === "Escape") {
      e.preventDefault();
      resultsList.innerHTML = "";
      // Limpa tudo e tira foco
      input.value = "";
      activeIndex = -1;
      clearHighlights();
      input.blur(); // opcional: tira foco do input
    }
  });

  // 12-CLIQUE FORA DA BUSCA.Detecta clique em qualquer lugar
  document.addEventListener("click", e => {
    //Se clicou fora da busca → limpa tudo
    if (!searchContainer.contains(e.target)) {
      resultsList.innerHTML = "";
      input.value = "";
      clearHighlights();
    }
  });

}



