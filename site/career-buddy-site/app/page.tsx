import JobList from "../components/job-list";

export default function Home() {
  return (
    <main className="page-shell">
      <header className="hero">
        <span className="eyebrow">Career Buddy · Opportunities</span>
        <h1>Find your next role.</h1>
        <p>Explore roles selected to help you build the career you want.</p>
      </header>
      <section aria-labelledby="jobs-heading">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Open positions</span>
            <h2 id="jobs-heading">Browse jobs</h2>
          </div>
        </div>
        <JobList />
      </section>
    </main>
  );
}
