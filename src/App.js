import './App.css';
import { BrowserRouter, Switch, Route } from 'react-router-dom';
import Header from './page/Header/Header';
import Home from './page/Home/Home';
import NotFound from './page/NotFound/NotFound';
import Footer from './page/Footer/Footer';
import AuthProvider from './Components/Context/AuthProvider';

import About from './page/About/About';
import Contact from './page/Contact/Contact';

import Products from './page/Products/Products';
import Blog from './page/Blog/Blog';
import AddProduct from './page/AddProduct/AddProduct';
import Login from './page/Login/Login';
import PrivateRouter from './Components/PrivateRouter/PrivateRouter';
import BuyProducts from './page/BuyProducts/BuyProducts';
import CustomerOrders from './page/CustomerOreders/CustomerOrders';
import MyOrders from './page/MyOrders/MyOrders';
import Admin from './page/Admin/Admin';
import AdminRouter from './Components/AdminRouter/AdminRouter';
import WhatsAppButton from './Components/WhatsAppButton/WhatsAppButton';


function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Header></Header>

          <Switch>
            <Route exact path="/">
              <Home></Home>
            </Route>
            <Route exact path="/home">
              <Home></Home>
            </Route>

            <Route exact path="/products">
              <Products></Products>
            </Route>
             <AdminRouter exact path="/addProducts">
              <AddProduct></AddProduct>
            </AdminRouter>
             <PrivateRouter exact path="/buyProduct/:productId">
              <BuyProducts></BuyProducts>
            </PrivateRouter>
            <AdminRouter exact path="/customerOrders">
              <CustomerOrders></CustomerOrders>
            </AdminRouter>
            <AdminRouter exact path="/admin">
              <Admin></Admin>
            </AdminRouter>
            <PrivateRouter exact path="/myOrders">
              <MyOrders></MyOrders>
            </PrivateRouter>
            

            <Route exact path="/blog">
              <Blog></Blog>
            </Route>

            <Route exact path="/about">
              <About></About>
            </Route>

            <Route exact path="/contact">
              <Contact></Contact>
            </Route>
              <Route exact path="/login">
              <Login></Login>
            </Route>

            <Route exact path="*">
              <NotFound></NotFound>
            </Route>
          </Switch>
          <WhatsAppButton></WhatsAppButton>
          <Footer></Footer>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
