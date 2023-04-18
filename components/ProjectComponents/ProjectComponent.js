import Image from "next/image";
import { useId } from "react";
import ProjectLanguages from "./ProjectLanguages";
import ProjectCategories from "./ProjectCategories";
import ProjectTitleAndStatus from "./ProjectTitleAndStatus";
import ProjectWebsiteLink from "./ProjectWebsiteLink";

const Project = ({ locale, t, ...item }) => {
  const keyId = useId();

  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      aria-label={item.title}
      href={item.url}
      key={keyId}
      className="cursor-fabiosh rounded-md border border-gray-400 bg-white shadow-sm duration-200 hover:-translate-y-1 hover:border-emerald-400 hover:shadow dark:bg-[#1d1d1f]"
    >
      {!item.finished && item.published ? (
        <picture className="inset-0 block max-h-[250px]">
          <Image
            src={item.image || "/meta_pic.pn"}
            width={400}
            height={200}
            alt={item.title}
            placeholder="blur"
            blurDataURL={item.image || "/meta_pic.png"}
            className="max-h-[220px] rounded-t-md object-cover grayscale duration-200 hover:grayscale-0"
          />
        </picture>
      ) : (
        <div className="h-1 rounded-t-md" key={keyId + "null"}></div>
      )}
      <div className="rounded-b-md bg-white p-4 text-sm dark:bg-[#1d1d1f]">
        <ProjectTitleAndStatus {...item} />

        <p className="mb-2 text-gray-700 dark:text-gray-100">
          {item.description[locale].text !== ""
            ? item.description[locale].text
            : item.description["en"].text}
        </p>
        <span className="mb-2 block text-gray-400">
          {item.languages.map((language) => (
            <ProjectLanguages language={language} />
          ))}
        </span>
        <ProjectWebsiteLink text={t.website} {...item} />
        <div className="mt-4 overflow-y-auto">
          {item.categories.map((category) => (
            <ProjectCategories category={category} />
          ))}
        </div>
      </div>
    </a>
  );
};

export default Project;
