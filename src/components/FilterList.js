 export function filterList() {

    const input = document.querySelector("#search");
    const results = document.querySelector("#search-results");

     // Se esta página não possui o campo de pesquisa, encerra a função.
    if (!input || !results) return;

    // elementos que serão pesquisados
    const elementos = document.querySelectorAll( "p, h2");

    input.addEventListener("input", () => {               //O evento "input" dispara toda vez que o valor do campo de texto muda (cada tecla digitada, colar texto, apagar, etc
        const termo = input.value.toLowerCase().trim(); // input.valuepega o texto que está escrito dentro do campo. .toLowerCase() transforma tudo em minúsculas (para a busca não diferenciar. .trim() remove espaços em branco do início e do fim do texto. O resultado fica guardado em termo.
        // limpa resultados anteriores
        results.innerHTML = "";
        // se campo vazio para
        if (!termo) return; //return sai da função imediatamente, sem executar o resto do código.

        elementos.forEach(elemento => {                       //.forEach() é um método que percorre cada item de uma lista
            const texto = elemento.textContent.toLowerCase(); //textContent pega apenas o texto de dentro do elemento (sem tags HTML).

            if(texto.includes(termo)) {    // .includes() verifica se uma string contém outra string dentro dela. Retorna true ou false.                 
                const li = document.createElement("li"); //document.createElement("li") cria um novo elemento HTML <li> (item de lista), mas ele ainda não está na página — só existe na memória por enquanto.
                li.innerHTML = `<a href="#">${elemento.textContent}</a>`; //href="#" é só um link "vazio" (não leva a lugar nenhum sozinho — vai ser controlado pelo JavaScript).

                li.addEventListener("click", (e)=>{  // e é o objeto do evento, que contém informações sobre o clique.
                    e.preventDefault();             // e.preventDefault() impede o comportamento padrão do link (que seria tentar navegar para "#")

                    elemento.scrollIntoView({      // .scrollIntoView() faz a página rolar automaticamente até que aquele elemento fique visível na tela.
                        behavior:"smooth"         // é um objeto de configuração dizendo que a rolagem deve ser suave (animada), e não instantânea.
                    });
                    
                    input.value="";            //Limpa o campo de busca.
                    results.innerHTML=" ";    //Limpa a lista de resultados   
                });

                results.appendChild(li); //.appendChild() adiciona o elemento <li> a lista <ul>
            }
        });
  });
}

