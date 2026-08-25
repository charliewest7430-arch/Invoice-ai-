import React, { useEffect } from 'react';

export interface SeoMetadataProps {
  title: string;
  description: string;
  canonicalUrl: string;
  ogType?: string;
  robots?: string;
  noIndex?: boolean;
  schemaJson?: object;
}

export const SeoHead: React.FC<SeoMetadataProps> = ({
  title,
  description,
  canonicalUrl,
  ogType = 'website',
  robots,
  noIndex = false,
  schemaJson,
}) => {
  useEffect(() => {
    // 1. Document Title
    document.title = title;

    // 2. Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);

    // 3. Robots Meta Tag
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.setAttribute('name', 'robots');
      document.head.appendChild(metaRobots);
    }
    const robotsContent = robots || (noIndex ? 'noindex, nofollow' : 'index, follow');
    metaRobots.setAttribute('content', robotsContent);

    // 4. Canonical URL
    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.setAttribute('rel', 'canonical');
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute('href', canonicalUrl);

    // 5. Open Graph Tags
    const updateMetaTag = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    updateMetaTag('og:title', title);
    updateMetaTag('og:description', description);
    updateMetaTag('og:url', canonicalUrl);
    updateMetaTag('og:type', ogType);
    updateMetaTag('og:site_name', 'InvoiceFlow');

    // 6. Twitter Card Tags
    const updateTwitterTag = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    updateTwitterTag('twitter:card', 'summary_large_image');
    updateTwitterTag('twitter:title', title);
    updateTwitterTag('twitter:description', description);
    updateTwitterTag('twitter:url', canonicalUrl);

    // 7. JSON-LD Structured Data
    if (schemaJson) {
      const scriptId = 'seo-page-structured-data';
      let script = document.getElementById(scriptId) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(schemaJson);
    }
  }, [title, description, canonicalUrl, ogType, robots, noIndex, schemaJson]);

  return null;
};
