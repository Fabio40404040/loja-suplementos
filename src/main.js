import './styles/index.css';
import './styles/products.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
// import search from './components/Search';
import {login} from "./components/Login";
import { register } from "./components/Register";
import { conta } from "./components/Conta";
import { pedidos } from "./components/Pedidos";
import { renderProducts } from "./components/Products";
import { updateCartBadge, renderCartPage } from "./components/Cart";
import  {initDropdown}  from "./components/Dropbtn";
import { checkLogin } from "./components/Auth";
import { menu } from './components/MenuIcone';
import { togglePasswordVisibility } from "./utils/togglePassword.js";
import { forgotPasswordForm } from "./components/ForgotPassword";
import { resetPasswordForm } from "./components/ResetPassword";
import { initTracking } from "./components/Tracking";
import { renderFavoritesPage } from "./components/Favorites";
import { initHelp } from "./components/Help";
import "./styles/help.css";

// search()
login();
register();
conta();
pedidos();
renderProducts();
updateCartBadge();
renderCartPage();
initDropdown();
checkLogin();
menu();
togglePasswordVisibility();
forgotPasswordForm();
resetPasswordForm();
initTracking();
renderFavoritesPage();
initHelp();

