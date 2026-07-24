"use client";

import { Avatar, Box, Divider, Typography } from "@mui/material";

type Props = {
  comments: any[];
};

export default function CommentList({ comments }: Props) {
  // Empty State
  if (!comments?.length) {
    return (
      <Box
        sx={{
          py: 3,
          textAlign: "center",
        }}
      >
        <Typography color="text.secondary">No discussion yet.</Typography>
      </Box>
    );
  }

  //  Helper
  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);

    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60)
      return `${diffInMinutes} min${diffInMinutes > 1 ? "s" : ""} ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24)
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;

    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays === 1) return "yesterday";

    if (diffInDays < 7)
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;

    return date.toLocaleDateString();
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Typography
        sx={{
          fontSize: 16,

          mb: 2,
          color: "#8f8f8f",
        }}
      >
        Discussion ({comments.length})
      </Typography>

      {comments.map((comment, index) => (
        <Box key={comment.id}>
          <Box
            sx={{
              display: "flex",
              gap: 1.5,
              py: 1,
              alignItems: "flex-start",
            }}
          >
            <Avatar
              sx={{
                width: 24,
                height: 24,
                fontSize: 12,
                fontWeight: 700,
                bgcolor: "#e5e7eb",
                color: "#4b5563",
                flexShrink: 0,
              }}
            >
              {comment.user?.username?.charAt(0).toUpperCase()}
            </Avatar>

            <Box sx={{ flex: 1 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Typography
                  component="span"
                  sx={{
                    fontSize: 13,
                    mt: "1px",

                    fontWeight: 600,
                    color: "#1f2937",
                  }}
                >
                  {comment.user?.username}
                </Typography>

                <Typography
                  sx={{
                    fontSize: 11,
                    color: "text.secondary",
                    mt: 0.25,
                  }}
                >
                  • {getRelativeTime(comment.created_at)}
                </Typography>
              </Box>

              <Typography
                sx={{
                  px: 1,
                  mt: "2px",
                  bgcolor: "#f8fafc",
                  borderRadius: 2,
                  fontSize: 15,
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                }}
              >
                {comment.content}
              </Typography>
            </Box>
          </Box>
          {index < comments.length - 1 && <Divider />}
        </Box>
      ))}
    </Box>
  );
}
