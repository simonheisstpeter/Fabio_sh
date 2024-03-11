import React from "react";
import Card from "../components/Card";
import Container from "../components/Container";

const CardData = [
  {
    title: "Project 1",
    text: "",
    graphic: "",
    link: "",
  },
  {
    title: "Project 2",
    text: "",
    graphic: "",
    link: "",
  },
  {
    title: "Project 3",
    text: "",
    graphic: "",
    link: "",
  },
];

const Test = () => {
  return (
    <Container>
      <section className="max-w-6xl mx-auto grid lg:grid-cols-3 lg:grid-rows-2 gap-4 min-h-[500px] ">
        {CardData.map((item, index) => (
          <React.Fragment key={index}>
            <Card title={item.title} text={item.text} itemKey={index} />
          </React.Fragment>
        ))}
      </section>
    </Container>
  );
};

export default Test;
