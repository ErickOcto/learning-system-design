import React from 'react';

export interface RealWorldExample {
  name: string;
  description: string;
}

export interface TopicTradeoffs {
  pros: string[];
  cons: string[];
  whenNotToUse: string;
}

export interface TopicPageProps {
  topicId: string;
  title: string;
  group: string;
  explanation: string;
  realWorldExamples: RealWorldExample[];
  tradeoffs: TopicTradeoffs;
  relatedTopicIds: string[];
  Visualizer?: React.ComponentType;
}
