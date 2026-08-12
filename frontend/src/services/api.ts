import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Mutex } from "async-mutex";

const mutex = new Mutex();

const baseQuery = fetchBaseQuery({
  baseUrl: "http://127.0.0.1:8000/api/v1/",

  prepareHeaders: (headers) => {
    const token = localStorage.getItem("access_token");

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return headers;
  },
});

const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  await mutex.waitForUnlock();

  let result = await baseQuery(args, api, extraOptions);

  const url = typeof args === "string" ? args : args?.url;
  const isAuthEndpoint =
    typeof url === "string" &&
    (url.includes("/auth/login") ||
      url.includes("/auth/register") ||
      url.includes("/auth/refresh"));

  if (result.error?.status === 401 && !isAuthEndpoint) {
    const refreshToken = localStorage.getItem("refresh_token");

    if (!refreshToken) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");

      window.location.replace("/login");

      return result;
    }

    if (!mutex.isLocked()) {
      const release = await mutex.acquire();

      try {
        const refreshResult = await baseQuery(
          {
            url: "/auth/refresh",
            method: "POST",
            body: {
              refresh_token: refreshToken,
            },
          },
          api,
          extraOptions,
        );

        if (refreshResult.data) {
          const data = refreshResult.data as {
            access_token: string;
          };

          localStorage.setItem("access_token", data.access_token);

          result = await baseQuery(args, api, extraOptions);
        } else {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");

          window.location.replace("/login");
        }
      } finally {
        release();
      }
    } else {
      await mutex.waitForUnlock();

      result = await baseQuery(args, api, extraOptions);
    }
  }

  return result;
};

export const api = createApi({
  reducerPath: "api",

  baseQuery: baseQueryWithReauth,

  tagTypes: ["Tasks", "Task", "Users", "Subtasks", "CurrentUser"],

  endpoints: (builder) => ({
    // Tasks

    getTasks: builder.query<any, any>({
      query: (filters) => {
        const params = new URLSearchParams();

        if (filters?.search) params.append("search", filters.search);
        if (filters?.status) params.append("status", filters.status);
        if (filters?.sprint) params.append("sprint", filters.sprint);
        if (filters?.user_id) params.append("user_id", filters.user_id);

        if (filters?.page) params.append("page", filters.page);
        if (filters?.page_size) params.append("page_size", filters.page_size);

        if (filters?.sort_by) params.append("sort_by", filters.sort_by);
        if (filters?.sort_order)
          params.append("sort_order", filters.sort_order);

        return `/task1/?${params.toString()}`;
      },

      providesTags: ["Tasks"],
    }),

    getTaskById: builder.query<any, number>({
      query: (taskId) => `/task1/${taskId}`,
      providesTags: (_result, _error, id) => [{ type: "Task", id }],
    }),

    createTask: builder.mutation<any, any>({
      query: (taskData) => ({
        url: "/task1/",
        method: "POST",
        body: taskData,
      }),
      invalidatesTags: ["Tasks"], // ✅ AUTO REFRESH TASKS
    }),

    deleteTask: builder.mutation({
      query: (taskId) => ({
        url: `/task1/${taskId}`,
        method: "DELETE",
      }),

      invalidatesTags: (_result, _error, taskId) => [
        "Tasks",
        { type: "Task", id: taskId },
      ],
    }),

    updateTask: builder.mutation({
      query: ({ id, data }) => ({
        url: `/task1/${id}`,
        method: "PATCH",
        body: data,
      }),

      invalidatesTags: (_result, _error, { id }) => [
        "Tasks",
        { type: "Task", id },
      ],
    }),

    getKanbanTasks: builder.query<any, any>({
      query: (filters) => {
        const params = new URLSearchParams();
        if (filters?.search) {
          params.append("search", filters.search);
        }
        if (filters?.sprint) {
          params.append("sprint", filters.sprint);
        }
        if (filters?.user_id) {
          params.append("user_id", filters.user_id);
        }
        if (filters?.sort_by) {
          params.append("sort_by", filters.sort_by);
        }
        if (filters?.sort_order) {
          params.append("sort_order", filters.sort_order);
        }
        if (filters?.backlog_page) {
          params.append("backlog_page", filters.backlog_page);
        }
        if (filters?.todo_page) {
          params.append("todo_page", filters.todo_page);
        }
        if (filters?.in_progress_page) {
          params.append("in_progress_page", filters.in_progress_page);
        }
        if (filters?.in_review_page) {
          params.append("in_review_page", filters.in_review_page);
        }
        if (filters?.qa_page) {
          params.append("qa_page", filters.qa_page);
        }
        if (filters?.completed_page) {
          params.append("completed_page", filters.completed_page);
        }
        return `/task1/kanban?${params.toString()}`;
      },

      providesTags: ["Tasks"],
    }),

    // Subtasks

    getSubtasks: builder.query<any, any>({
      query: ({
        task_id,
        status,
        user_id,
        search,
        sort_by,
        sort_order,
        page = 1,
        page_size = 5,
      }) => {
        const params = new URLSearchParams();

        if (status) params.append("status", status);
        if (user_id) params.append("user_id", user_id);
        if (search) params.append("search", search);

        params.append("page", String(page));
        params.append("page_size", String(page_size));

        if (sort_by) {
          params.append("sort_by", sort_by);
        }

        if (sort_order) {
          params.append("sort_order", sort_order);
        }

        return `/tasks/${task_id}/subtasks?${params.toString()}`;
      },
      providesTags: ["Subtasks"],
    }),

    getSubtaskById: builder.query<any, number>({
      query: (subtaskId) => `/subtasks/${subtaskId}`,
      providesTags: ["Subtasks"],
    }),

    createSubtask: builder.mutation<any, { taskId: number; data: any }>({
      query: ({ taskId, data }) => ({
        url: `/tasks/${taskId}/subtasks`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Subtasks", "Tasks"],
    }),

    updateSubtask: builder.mutation({
      query: ({ id, data }) => ({
        url: `/subtasks/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Subtasks", "Tasks"],
    }),

    deleteSubtask: builder.mutation({
      query: (subtaskId) => ({
        url: `/subtasks/${subtaskId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Subtasks", "Tasks"],
    }),

    bulkDeleteSubtasks: builder.mutation({
      query: (body: { task_id: number; ids: number[] }) => ({
        url: "/subtasks/bulk",
        method: "DELETE",
        body,
      }),
      invalidatesTags: ["Subtasks", "Tasks"],
    }),

    // Comments

    addTaskComment: builder.mutation({
      query: ({ taskId, data }) => ({
        url: `/tasks/${taskId}/comments`,
        method: "POST",
        body: data,
      }),

      invalidatesTags: (_result, _error, { taskId }) => [
        "Tasks",
        { type: "Task", id: taskId },
      ],
    }),

    // ✅ ADD SUBTASK COMMENT
    addSubtaskComment: builder.mutation<any, { subtaskId: number; data: any }>({
      query: ({ subtaskId, data }) => ({
        url: `/subtasks/${subtaskId}/comments`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Subtasks"],
    }),

    // AUTH

    loginUser: builder.mutation({
      query: (data) => ({
        url: "/auth/login",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["CurrentUser"],
    }),
    // prettier-ignore
    registerUser: builder.mutation<any,{ username: string; email: string; password: string }>({
      query: (data) => ({
        url: "/auth/register",
        method: "POST",
        body: data,
      }),
    }),

    logoutUser: builder.mutation({
      query: (refresh_token) => ({
        url: "/auth/logout",
        method: "POST",
        body: {
          refresh_token,
        },
      }),
    }),

    getCurrentUser: builder.query({
      query: () => "/auth/me",
      providesTags: ["CurrentUser"],
    }),

    updateMe: builder.mutation({
      query: (data) => ({
        url: "/auth/me",
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["CurrentUser"],
    }),

    changePassword: builder.mutation({
      query: (data) => ({
        url: "/auth/me/password",
        method: "PATCH",
        body: data,
      }),
    }),

    // User

    getUsers: builder.query<any, void>({
      query: () => "/users",
      providesTags: ["Users"],
    }),

    deleteUser: builder.mutation<{ detail: string }, number>({
      query: (userId) => ({
        url: `/users/${userId}`,
        method: "DELETE",
      }),

      invalidatesTags: ["Users", "Tasks", "Task", "Subtasks"],
    }),

    updateUser: builder.mutation({
      query: ({ userId, data }) => ({
        url: `/users/${userId}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Users"],
    }),

    // Extras

    getSprints: builder.query<string[], void>({
      query: () => "/task1/sprints",
    }),

    getDashboardStats: builder.query({
      query: () => "/dashboard/stats",
    }),

    getRoles: builder.query({
      query: () => "/roles",
      providesTags: ["Users"],
    }),

    // END
  }),
});

export const {
  //task
  useGetTasksQuery,
  useGetTaskByIdQuery,
  useCreateTaskMutation,
  useDeleteTaskMutation,
  useUpdateTaskMutation,
  useGetKanbanTasksQuery,

  //subtasks
  useGetSubtasksQuery,
  useGetSubtaskByIdQuery,
  useCreateSubtaskMutation,
  useUpdateSubtaskMutation,
  useDeleteSubtaskMutation,
  useBulkDeleteSubtasksMutation,

  //comments
  useAddTaskCommentMutation,
  useAddSubtaskCommentMutation,

  //auth
  useLoginUserMutation,
  useRegisterUserMutation,
  useLogoutUserMutation,
  useDeleteUserMutation,
  useUpdateUserMutation,
  useChangePasswordMutation,

  //users
  useGetUsersQuery,
  useGetCurrentUserQuery,
  useGetRolesQuery,
  useUpdateMeMutation,

  //extra
  useGetSprintsQuery,
  useGetDashboardStatsQuery,
} = api;
