import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible_Next, Hanken_Grotesk } from "next/font/google";
import "./tokens.css";
import "./viltrum-tokens.css";

/**
 * Fuentes del sistema de diseño (T5), portadas de
 * `referencia-prototipo/app/layout.tsx`. `next/font/google` las descarga en
 * build y expone `--font-atkinson`/`--font-hanken`, las mismas variables que
 * consume `globals.css`. Ambas existen en el catálogo de esta versión de
 * Next — no hace falta pila de respaldo.
 */
const atkinson = Atkinson_Hyperlegible_Next({
  variable: "--font-atkinson",
  subsets: ["latin"],
  adjustFontFallback: false,
});

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  adjustFontFallback: false,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#10172d",
};

export const metadata: Metadata = {
  title: "Quisqueya Home Private Desk · CRM",
  description: "Consola de operaciones y CRM inmobiliario de Quisqueya Home",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "QH CRM",
  },
  icons: {
    icon: "/brand/app-icon-192.png",
    apple: "/brand/app-icon-192.png",
  },
};

const EXTENSION_ATTR_SANITIZER_SCRIPT = `(function(){try{var attrs=["bis_skin_checked","bis_register","bis_id","bis_size","data-new-gr-c-s-check-loaded","data-gr-ext-installed"];var clean=function(root){if(!root||!root.querySelectorAll)return;for(var i=0;i<attrs.length;i++){var a=attrs[i];if(root.removeAttribute&&root.hasAttribute&&root.hasAttribute(a))root.removeAttribute(a);var nodes=root.querySelectorAll("["+a+"]");for(var j=0;j<nodes.length;j++)nodes[j].removeAttribute(a);}};clean(document.documentElement);document.addEventListener("readystatechange",function(){clean(document.documentElement);},true);window.addEventListener("DOMContentLoaded",function(){clean(document.documentElement);},true);var obs=new MutationObserver(function(mutations){for(var i=0;i<mutations.length;i++){var m=mutations[i];if(m.type==="attributes"&&m.attributeName&&(m.attributeName.indexOf("bis_")===0||attrs.indexOf(m.attributeName)!==-1)&&m.target&&m.target.removeAttribute){m.target.removeAttribute(m.attributeName);}else if(m.type==="childList"&&m.addedNodes){for(var k=0;k<m.addedNodes.length;k++){var n=m.addedNodes[k];if(n&&n.nodeType===1)clean(n);}}}});obs.observe(document.documentElement,{attributes:true,childList:true,subtree:true,attributeFilter:attrs});}catch(_){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head suppressHydrationWarning>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: EXTENSION_ATTR_SANITIZER_SCRIPT }}
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${atkinson.variable} ${hanken.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
