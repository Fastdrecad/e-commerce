import React from "react";
import { Link } from "react-router-dom";

const Header: React.FC = () => {
  return (
    <header className="header">
      <Link to="/" className="header__logo">
        Goddess Within
      </Link>

      {/* Navigation */}
      <nav>
        <Link to="/products" className="header__nav-link">
          Products
        </Link>
        <Link to="/categories" className="header__nav-link">
          Categories
        </Link>
        <Link to="/about" className="header__nav-link">
          About
        </Link>
      </nav>

      {/* User Actions */}

      <div className="header__actions">
        <Link to="/search" className="header__action-link">
          shop
        </Link>
        <Link to="/brands" className="header__action-link">
          brands
        </Link>
        <Link to="/wishlist" className="header__action-link">
          wishlist
        </Link>
        <Link to="/cart" className="header__action-link">
          cart
        </Link>
        <Link to="/brands" className="header__action-link">
          brands
        </Link>
        <Link to="/account" className="header__action-link">
          account
        </Link>
      </div>
    </header>
  );
};

export default Header;
