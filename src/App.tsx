

import { useState} from "react";
import { BrowserRouter, Routes, Route, Link, useParams } from "react-router-dom";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import {create} from 'zustand';

type Level = 'junior' | 'middle' | 'senior';

type Job = {
  id: number;
  title: string;
  company: string;
  salary: number;
  remote: boolean;
  level: Level;
}



type JobCardProps = {
  job: Job;
  saved: boolean;
  onToggleSave: (id: number) => void;
}

type JobPageProps = {
  jobs: Job[];
}

type JobsPageProps = {
  jobs: Job[];
}

type SavedStore = {
  savedIds: number[];
  onToggleSave: (id: number) => void;
}

const useSavedStore = create<SavedStore>((set) => ({
  savedIds: [],
  onToggleSave: (id) => 
    set((state) => ({
      savedIds: state.savedIds.includes(id)
      ? state.savedIds.filter((x) => x !== id)
      : [...state.savedIds, id],
    })),
}));

type LevelFilter = Level | 'all';
type SortBy = 'none' | 'salary-desc';

type JobFiltersProps = {
  query: string;
  onQueryChange: (value: string) => void;
  levelFilter: LevelFilter;
  onLevelFilterChange: (value: LevelFilter) => void;
  onlyRemote: boolean;
  onOnlyRemoteChange: (value: boolean) => void;
  sortBy: SortBy;
  onSortByChange: (value: SortBy) => void;
}

function JobCard({job, saved, onToggleSave}: JobCardProps) {
  return (
    <div>
      <h2>
        <Link to={`/jobs/${job.id}`} >{job.title}</Link> {saved ?'⭐' :null}
      </h2>
      <p>{job.company}</p>
      <p>{job.salary}</p>
      <p>{job.level}</p>
      <p>{job.remote === true ? 'Удалённо' : 'Офис'}</p>
      <button onClick={()=> onToggleSave(job.id)}>{saved ? 'Сохранено' : 'Сохранить'}</button>

    </div>
  )
}

function JobFilters({query, levelFilter, onlyRemote, sortBy, onQueryChange, onLevelFilterChange, onOnlyRemoteChange, onSortByChange}: JobFiltersProps) {
  return (
    <>

    <select value={levelFilter} onChange={(e) => onLevelFilterChange(e.target.value as LevelFilter)}>
    <option value="all">Все</option>
    <option value="junior">junior</option>
    <option value="middle">middle</option>
    <option value="senior">senior</option>
  </select>

  <input type="checkbox" checked={onlyRemote} onChange={() => onOnlyRemoteChange(!onlyRemote)} />
  <input type="text" value={query} onChange={(e) => onQueryChange(e.target.value)}/>
  <select value={sortBy} onChange={(e) => onSortByChange(e.target.value as SortBy)}>
    <option value="none">Без сортировки</option>
    <option value="salary-desc">Сначала дорогие</option>
  </select>
    </>
  )
}

function JobsPage({jobs}: JobsPageProps) {
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [onlyRemote, setOnlyRemote] = useState(false);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('none');
  const [onlySaved, setOnlySaved] = useState(false);
  const savedIds = useSavedStore((state) => state.savedIds);
const onToggleSave = useSavedStore((state) => state.onToggleSave);

  const filteredJobs = jobs
  .filter((p) => !onlyRemote || p.remote)
  .filter((p) => levelFilter === 'all' || p.level === levelFilter)
  .filter((p) => query === '' || p.title.toLowerCase().includes(query.toLowerCase()))
  .filter((p) => !onlySaved || savedIds.includes(p.id));

  const visibleJobs = 
  sortBy === 'salary-desc'
  ? [...filteredJobs].sort((a, b) => b.salary - a.salary)
  : filteredJobs;
  
  return (
<>  
  
  <p>Сохранено: {savedIds.length}</p>
  <label><input type="checkbox" checked={onlySaved} onChange={() => setOnlySaved(!onlySaved)} />Только сохраненные</label>
  {visibleJobs.length === 0 && <p>Ничего не найдено</p>}
  <JobFilters
  query={query}
  onQueryChange={setQuery}
  levelFilter={levelFilter}
  onLevelFilterChange={setLevelFilter}
  onlyRemote={onlyRemote}
  onOnlyRemoteChange={setOnlyRemote}
  sortBy={sortBy}
  onSortByChange={setSortBy}
  />
  {visibleJobs.map((job) => (
    <JobCard
  key={job.id}
  job={job}
  saved={savedIds.includes(job.id)}
  onToggleSave={onToggleSave}
  />
  ))}
  
  </>
  )
}


function JobPage({jobs}: JobPageProps){
const {id} = useParams();
const savedIds = useSavedStore((state) => state.savedIds);
const onToggleSave = useSavedStore((state) => state.onToggleSave);

const job = jobs.find((b) => b.id === Number(id));
if(!job) return <p>Вакансия не найдена</p>;

const saved = savedIds.includes(job.id)

return (

  <div>
    <h2>{job.title}{saved ?'⭐' :null}</h2>
    <p>{job.company}</p>
    <p>{job.salary}</p>
    <p>{job.level}</p>
    <p>{job.remote === true ? 'Удалённо' : 'Офис'}</p>
    <button onClick={()=> onToggleSave(job.id)}>{saved ? 'Сохранено' : 'Сохранить'}</button>
  </div>
)
}

function JobsApp() {
  const {data, isLoading, error} = useQuery({
    queryKey: ['jobs'],
    queryFn: () => fetch('/jobs.json').then((res) => res.json() as Promise<Job[]>),
  });

  if(isLoading) return <p>Загрузка...</p>;
  if(error) return <p>Ошибка загрузки</p>;
  return <BrowserRouter>
  <Link to="/">Главная</Link>
  <Routes>
    <Route path="/"
    element={<JobsPage jobs={data??[]} />} />
    <Route path="/jobs/:id" 
    element={<JobPage jobs={data??[]} />} />
  </Routes>
  </BrowserRouter>
}

const queryClient = new QueryClient();

function App() {  
  
return (
  <QueryClientProvider client={queryClient}>
  <JobsApp/>
  </QueryClientProvider>
)
}
export default App;

