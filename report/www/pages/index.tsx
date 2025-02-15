import type { NextPage } from "next";
import Head from "next/head";

import { Dashboard } from "../src/components/Dashboard";
import report from '@/report.json';
import dashlordConfig from '@/config.json';

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>
          {dashlordConfig.title} - tableau de bord des bonnes pratiques techniques
        </title>
      </Head>
      <Dashboard report={report} />
    </>
  );
};

export default Home;
