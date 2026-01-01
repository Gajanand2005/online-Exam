import React from 'react'
import logo from '../../assets/logo.jpeg'
import { motion } from "motion/react"
import Button from '@mui/material/Button';
import { Link } from "react-router-dom";


const Navbar = () => {
  return (
    <>
     <div className="navbar mt-50">
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
      <div className='login-button flex items-center justify-center mt-5 mb-5 gap-5'>
        <Link to="/teacher-login">
      <Button className='!text-black !bg-zinc-300 hover:!bg-indigo-500/50 rounded-md !text-[15px] '>Teacher Login</Button>
      </Link>
      <Link to="/principal-login">
      <Button className='!text-black !bg-zinc-300 hover:!bg-indigo-500/50 rounded-md !text-[15px]'>Principal Login</Button>
      </Link>
      </div>
      </div>
    </div>
    </>
  )
}

export default Navbar
