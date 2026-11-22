import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SearchService } from './search.service';
import { TaskService } from './task.service';
import { ProjectService } from './project.service';
import { MockDataService } from './mock-data.service';

describe('Phase 10: Global Search Service', () => {
  let searchService: SearchService;
  let taskService: TaskService;
  let projectService: ProjectService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        MockDataService,
        TaskService,
        ProjectService,
        SearchService
      ]
    });

    searchService = TestBed.inject(SearchService);
    taskService = TestBed.inject(TaskService);
    projectService = TestBed.inject(ProjectService);
  });

  it('1. should return empty results when search query is empty or whitespace', async () => {
    const emptyResult = await firstValueFrom(searchService.search(''));
    expect(emptyResult.query).toBe('');
    expect(emptyResult.tasks).toEqual([]);
    expect(emptyResult.projects).toEqual([]);
    expect(emptyResult.totalCount).toBe(0);

    const spaceResult = await firstValueFrom(searchService.search('   '));
    expect(spaceResult.totalCount).toBe(0);
  });

  it('2. should find tasks by title with case-insensitive matching', async () => {
    const result = await firstValueFrom(searchService.search('rest api'));
    expect(result.tasks.length).toBeGreaterThan(0);
    expect(result.tasks.some(t => t.title.toLowerCase().includes('rest api'))).toBe(true);
  });

  it('3. should find tasks by description text', async () => {
    const result = await firstValueFrom(searchService.search('tooltip'));
    expect(result.tasks.length).toBeGreaterThan(0);
    expect(result.tasks.some(t => t.description.toLowerCase().includes('tooltip'))).toBe(true);
  });

  it('4. should find projects by name with partial query and trimming', async () => {
    const result = await firstValueFrom(searchService.search('  Pulse  '));
    expect(result.projects.length).toBeGreaterThan(0);
    expect(result.projects.some(p => p.name.includes('Pulse'))).toBe(true);
    expect(result.query).toBe('Pulse');
  });

  it('5. should find projects by description', async () => {
    const result = await firstValueFrom(searchService.search('microservices'));
    expect(result.projects.length).toBeGreaterThan(0);
    expect(result.projects.some(p => p.description.toLowerCase().includes('microservices'))).toBe(true);
  });

  it('6. should correctly aggregate totalCount across matching tasks and projects', async () => {
    const result = await firstValueFrom(searchService.search('design'));
    expect(result.totalCount).toBe(result.tasks.length + result.projects.length);
    expect(result.totalCount).toBeGreaterThan(0);
  });

  it('7. should return zero results when no task or project matches the query', async () => {
    const result = await firstValueFrom(searchService.search('xyzNonExistentQuery999'));
    expect(result.tasks.length).toBe(0);
    expect(result.projects.length).toBe(0);
    expect(result.totalCount).toBe(0);
  });
});

