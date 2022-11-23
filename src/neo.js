// const neo4j = require("neo4j-driver");
import neo4j from "neo4j-driver";

// const apiKey = import.meta.env.VITE_VERCEL_AIRTABLE_API_KEY;
const uri = import.meta.env.VITE_VERCEL_URI;
const user = import.meta.env.VITE_VERCEL_USER;
const password = import.meta.env.VITE_VERCEL_PASSWORD;
console.log("password :>> ", password);
console.log("user :>> ", user);
console.log("uri :>> ", uri);
const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

async function makeUserLikeABuild(userName, buildName) {
  // To learn more about sessions: https://neo4j.com/docs/javascript-manual/current/session-api/
  const session = driver.session({ database: "neo4j" });

  try {
    // To learn more about the Cypher syntax, see: https://neo4j.com/docs/cypher-manual/current/
    // The Reference Card is also a good resource for keywords: https://neo4j.com/docs/cypher-refcard/current/
    const writeQuery = `MERGE (p1:User { name: $userName })
                                MERGE (p2:Build { name: $buildName })
                                MERGE (p1)-[:LIKES]->(p2)
                                RETURN p1, p2`;

    // Write transactions allow the driver to handle retries and transient errors.
    const writeResult = await session.executeWrite((tx) =>
      tx.run(writeQuery, { userName, buildName })
    );

    // Check the write results.
    writeResult.records.forEach((record) => {
      const user = record.get("p1");
      const build = record.get("p2");
      console.info(
        `Created friendship between: ${user.properties.name}, ${build.properties.name}`
      );
    });
  } catch (error) {
    console.error(`Something went wrong: ${error}`);
  } finally {
    // Close down the session if you're not using it anymore.
    await session.close();
  }
}

async function findBuild(buildName) {
  const session = driver.session({ database: "neo4j" });

  try {
    const readQuery = `
        MATCH (build:Build)
        WHERE build.name contains $buildName
        RETURN build
    `;

    const readResult = await session.executeRead((transaction) =>
      transaction.run(readQuery, { buildName })
    );
    console.log("readResult :>> ", readResult);
    readResult.records.forEach((record) => {
      console.log(`Found Build: ${record.get("name")}`);
    });
    return readResult;
  } catch (error) {
    console.error(`Something went wrong: ${error}`);
  } finally {
    await session.close();
  }
}

async function findBuildsForUser(userName = null) {
  const session = driver.session({ database: "neo4j" });

  const readQuery = `
    match (user:User)
    where user.Name = 'Nick'
    OPTIONAL MATCH (user)-[rb:HAS_BUILD]->(build:Build)-[rp:HAS_PART]->(part)
    return user, build, part, rp, rb
`;
  //   const readQuery = `
  //         MATCH (user:User {Name:$userName}), (build:Build)
  //         MATCH (user)-[rel:HAS_BUILD]->(build)
  //         RETURN user, rel, build
  //     `;

  try {
    const readResult = await session.executeRead((transaction) =>
      transaction.run(readQuery, { userName })
    );
    // console.log("readQuery :>> ", readQuery);
    // console.log("readResult :>> ", readResult);
    readResult.records.forEach((record) => {
      console.log(`Found Build for ${userName}`);
    });
    return readResult;
  } catch (error) {
    console.error(`Something went wrong: ${error}`);
  } finally {
    await session.close();
  }
}

async function getRecommendations(partName = "", buildName = "") {
  const session = driver.session({ database: "neo4j" });

  const readQuery = `
        
        match (user:User)-[like:LIKES]-(build:Build )-[p:HAS_PART]->(part:Part)
        where part.Name contains 'Black' or part.Name contains '80'
        return user,build, like, p, part, count(*) as occurrence
        order by occurrence desc
        limit 5

    `;

  try {
    const readResult = await session.executeRead((transaction) =>
      transaction.run(readQuery, { partName, buildName })
    );
    console.log("readResult :>> ", readResult);
    readResult.records.forEach((record) => {
      //   console.log(
      //     `Found Recommended Builds with Part ${partName}: ${record.get(
      //       "part.Kind"
      //     )}`
      //   );
    });
  } catch (error) {
    console.error(`Something went wrong: ${error}`);
  } finally {
    await session.close();
    return readResult;
  }
}

(async () => {
  try {
    const userName = "Nick";
    const build2Name = "Spectre";

    await makeUserLikeABuild(userName, build2Name);

    // let builds = await findBuild(userName);
    // console.log("builds :>> ", builds);
    let builds = await findBuild(build2Name);
    console.log("builds :>> ", builds);

    // const builds_for_user = await findBuildsForUser(userName);
    // // console.log("builds_for_user :>> ", builds_for_user);
    // const recommendations = await getRecommendations("80");
  } catch (error) {
    console.error(`Something went wrong: ${error}`);
  } finally {
    // Don't forget to close the driver connection when you're finished with it.
    await driver.close();
  }
})();

// function get_builds() {
//   const query = `
//     match (p:Build)
//     return p
//     limit 10
//     `;
// }
