const style = `
    width: 100%;
    height: auto;
    margin: 5rem auto;
    padding: 4rem;
    display: block;
    background: linear-gradient(120deg,  #34d399 0%, #111827 100%);
    line-height: 4.5rem;
    color: white;
    border-radius: 1rem;
    font-size: 2rem;
`;

export const ConsoleMessage = () =>
  console.log(
    "%c🙆🙆🙆🙆🙆🙆🙆🙆🙆🙆🙆🙆\nHello and welcome to my console!\nLeave me a Message here if you want:\nhttps://fabio.sh/contact\n🙆🙆🙆🙆🙆🙆🙆🙆🙆🙆🙆🙆",
    style,
  );
