"use client";
import React from "react";
import { motion } from "framer-motion";
import { Button } from "./Button";
import { fadeInUp, MotionDiv } from "./animations";

export const Hero = () => {
  return (
    <motion.section
      initial="initial"
      animate="animate"
      className="self-end mt-40 w-full max-w-[1872px] max-md:mt-10 max-md:mr-2.5 max-md:max-w-full"
    >
      <div className="flex gap-5 max-md:flex-col">
        <MotionDiv
          variants={fadeInUp}
          className="w-[44%] max-md:ml-0 max-md:w-full"
        >
          <div className="flex flex-col items-start self-stretch my-auto w-full text-base tracking-normal text-black max-md:mt-10 max-md:max-w-full">
            <motion.h2 variants={fadeInUp} className="font-bold">
              Welcome Shahfahed!
            </motion.h2>
            <motion.h3
              variants={fadeInUp}
              className="mt-9 text-6xl tracking-tighter leading-none max-md:max-w-full max-md:text-4xl"
            >
              Your Bookish Haven
            </motion.h3>
            <motion.p
              variants={fadeInUp}
              className="self-stretch mt-10 text-2xl tracking-tight leading-loose max-md:max-w-full"
            >
              Connect with fellow bibliophiles and manage your literary
              treasures.
            </motion.p>
            <Button className="mt-16 max-md:mt-10">Discover</Button>
          </div>
        </MotionDiv>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="ml-5 w-[56%] max-md:ml-0 max-md:w-full"
        >
          <img
            loading="lazy"
            src="https://cdn.builder.io/api/v1/image/assets/fdb135f9d2b04a4eb3c5b8f756dcd3c8/a4dd13cbe4b9085e6e17397c073540b90610c64836e8ad24a0f6d7cc33f5e20b"
            className="object-contain grow w-full aspect-[1.5] max-md:mt-10 max-md:max-w-full"
            alt="Book illustration"
          />
        </motion.div>
      </div>
    </motion.section>
  );
};
