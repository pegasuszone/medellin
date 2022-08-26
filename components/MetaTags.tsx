import React, { FunctionComponent } from 'react';
import Head from 'next/head';

interface IMeta {
  description: string;
  image: string;
  ogImage: string;
  title: string;
  url: string;
}

const Meta: FunctionComponent<IMeta> = ({
  description,
  image,
  ogImage,
  title,
  url,
}) => {
  return (
    <Head>
      <title>{title}</title>
      <meta name="title" content={title} key="title" />
      <meta name="description" content={description} key="description" />

      <meta property="og:type" content="website" key="og:type" />
      <meta property="og:url" content={url} key="og:url" />
      <meta property="og:title" content={title} key="og:title" />
      <meta
        property="og:description"
        content={description}
        key="og:description"
      />
      <meta property="og:image" content={ogImage} key="og:image" />

      <meta
        property="twitter:card"
        content="summary_large_image"
        key="twitter:card"
      />
      <meta property="twitter:url" content={url} key="twitter:url" />
      <meta property="twitter:title" content={title} key="twitter:title" />
      <meta
        property="twitter:description"
        content={description}
        key="twitter:description"
      />
      <meta property="twitter:image" content={image} key="twitter:image" />
    </Head>
  );
};

export default Meta;
