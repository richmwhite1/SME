'use client'; 
import { useEffect, useState } from 'react';

interface Topic {
  id: number;
  name: string;
  slug?: string;
  description?: string | null;
}

export default function TopicPicker() {
  const [topics, setTopics] = useState<Topic[]>([]);

  useEffect(() => {
    // We use fetch so the BROWSER talks to the API, 
    // and the API (Server) talks to the DATABASE.
    fetch('/api/topics')
      .then(res => res.json())
      .then(data => setTopics(data))
      .catch(err => console.error("Tiles failed to load:", err));
  }, []);

  return (
    <div className="grid grid-cols-2 gap-4">
      {topics.map(topic => (
        <div 
          key={topic.id} 
          className="border border-translucent-emerald bg-forest-obsidian p-4 text-bone-white hover:border-heart-green transition-colors"
        >
          {topic.name}
        </div>
      ))}
    </div>
  );
}





