
/* Esse código controla abrir e fechar um menu dropdown ao clicar em um 
botão.
*/

export function initDropdown() {

  const button = document.querySelector(".dropbtn")
  const dropdown = document.querySelector(".dropdown-content")

  if (!button || !dropdown)return;

  function toggleDropdown(event) {
    event.stopPropagation();
    dropdown.classList.toggle("show");
  
  }
  
  function closeDropdown() {
    dropdown.classList.remove("show");
  }

  button.addEventListener("click", toggleDropdown);
  document.addEventListener("click", closeDropdown);


}



 



