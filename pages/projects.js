import Confetti from "../components/Confetti";
import Container from "../components/Container";
import { useRouter } from "next/router";
import { ProjectData } from "../utils/projectsData";
import ExtraBox from "../components/ProjectComponents/ExtraBox";
import Project from "../components/ProjectComponents/Project";

import locales from "../locales";

export default function ProjectsView() {
  const router = useRouter();
  const { locale } = router;
  const t = locales[locale] || locales["en"]; 


  const currentProjects = ProjectData.filter(
    (pr) => !pr.finished && pr.published
  );
  const upcomingProjects = ProjectData.filter(
    (pr) => !pr.finished && !pr.published
  );
  const finishedProjects = ProjectData.filter((pr) => pr.finished);


  return (
    <>
      <Container>
        <div className="container mx-auto h-full px-4 md:px-12">
          <h1 className="my-20 text-xl">{t.menuProjects}</h1>

          <h2 className="mb-6">{t.currentProjects}</h2>
          <article className="mb-20 grid grid-cols-1 gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {currentProjects.map((item) => (
              <Project key={item.id} {...item} locale={locale} t={t} />
            ))}
          </article>

          <h2 className="mb-6">{t.upcomingProjects}</h2>
          <article className="mb-20 grid grid-cols-1 gap-6 opacity-50 duration-200 hover:opacity-100 lg:grid-cols-3 xl:grid-cols-5">
            {upcomingProjects.map((item) => (
              <Project key={item.id} {...item} locale={locale} t={t} />
            ))}
            {/* Extra Box 
            <ExtraBox text={t.comingSoon} />*/}
          </article>

          <h2 className="mb-6">{t.finishedProjects}</h2>
          <article className="mb-20 grid grid-cols-1 gap-6 opacity-50 duration-200 hover:opacity-100 lg:grid-cols-3 xl:grid-cols-5">
            {finishedProjects.map((item) => (
              <Project key={item.id} {...item} locale={locale} t={t} />
            ))}

            {/* Extra Box */}
            <ExtraBox text={t.comingSoon} />
          </article>
        </div>
        <Confetti />
      </Container>
    </>
  );
}
