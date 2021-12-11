import React, { useEffect } from "react";
import Head from "next/head";
import { Theme, makeStyles, createStyles } from "@material-ui/core/styles";
import { auth } from "../lib/firebase";
import network from "../lib/network";
const useStyles = makeStyles((theme: Theme) => createStyles({}));

function Home() {
  const classes = useStyles({});

  useEffect(() => {
    network.get("test").then((res) => {
      console.log(res.data);
    });

    console.log(auth.app);
    console.log(auth.currentUser);
  }, []);

  return (
    <React.Fragment>
      <Head>
        <title>Home - Nextron (with-typescript-material-ui)</title>
      </Head>
      <div>Home</div>
    </React.Fragment>
  );
}

export default Home;
