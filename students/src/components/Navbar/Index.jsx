import React from 'react'
import logo from '../../assets/logo.jpeg'
import { motion } from "motion/react"
import Login from '../Login/Index.jsx'


const Navbar = () => {
  return (
    <>
    <div className="navbar">
      <div className="container">

        {/* Logo Section */}
        <div className="logo flex items-center justify-center mt-5">
          <motion.img
            src={logo}
            alt="School Logo"
            className="h-32"   
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.4,
              type: "spring",
              bounce: 0.5
            }}
          />
        </div>

        {/* Title */}
        <div className="nav-items flex items-center justify-center capitalize">
          <h1 className="mt-5 font-bold text-[20px] text-center">
            New Era SR Sec School Kund, Rewari
          </h1>
        </div>
        <Login />
      </div>
    </div>
   
    </>
  )
}

export default Navbar
