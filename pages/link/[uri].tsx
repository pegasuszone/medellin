import { LogoSpinner } from "components";
import { useRouter } from "next/router";
import { useEffect } from "react";

// Page to "unshorten link" & send it to trade page

const Link = () => {
  const router = useRouter();

  const { uri } = router.query;

  useEffect(() => {
    if (!uri) return;
    fetch("/api/shorturl?path=" + uri)
      .then((res) => {
        console.log(res);
        if (!res.ok) router.push("/");
        return res.json();
      })
      .then((json) => {
        console.log(json);
        router.push("/trade" + json.destination);
      });
  }, [uri]);
  return (
    <div className="flex items-center justify-center w-full h-screen">
      <LogoSpinner />
    </div>
  );
};

export default Link;
