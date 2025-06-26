-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 03, 2025 at 11:54 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `data_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `datasets`
--

CREATE TABLE `datasets` (
  `id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `filename` varchar(255) DEFAULT NULL,
  `size` varchar(50) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `filetype` varchar(50) DEFAULT NULL,
  `downloads` int(11) DEFAULT 0,
  `last_updated` date DEFAULT NULL,
  `starred` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `datasets`
--

INSERT INTO `datasets` (`id`, `name`, `filename`, `size`, `category`, `filetype`, `downloads`, `last_updated`, `starred`) VALUES
(1, 'exported-text (2).docx', 'exported-text (2).docx', '0.0 MB', 'General', '0', 1, '2025-06-01', 0),
(2, 'Perform network reconnaissance by using network scanning tools_Simulation transcript_EN.pdf', 'Perform network reconnaissance by using network scanning tools_Simulation transcript_EN.pdf', '0.5 MB', 'General', '0', 0, '2025-06-01', 0),
(3, 'DataRepo-main.zip', 'DataRepo-main.zip', '50.5 MB', 'General', '0', 1, '2025-06-03', 0);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expires` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password`, `created_at`, `reset_token`, `reset_token_expires`) VALUES
(1, 'Agook', 'geniusgemde09@gmail.com', '$2b$10$TiAX6me8NRk/w8dd1loswuTqnzTxutpBe4elfU/Yih4.gMbBQY5zS', '2025-05-21 13:02:47', NULL, NULL),
(2, 'chatbot', 'genius@gmail.com', '$2b$10$YVNmMw4cC3xcOmoEnxyzu.TZaAxojxNirkpjQSABr.flQ7bdgRTcO', '2025-05-23 07:21:39', NULL, NULL),
(3, 'gem', 'gemde09@gmail.com', '$2b$10$s2JauCI8TZ4N2gEo2Sk4semwZKdUrpQoAqi52F5FDihpAkhFLdGbK', '2025-05-23 09:34:43', NULL, NULL),
(4, 'Hillary ', 'mwendikimaiga21@gmail.com', '$2b$10$2YTjfcPkIkKfet4S1e9niuEHWzJVO6L8mKZRCAvMsm9UyknpHY7EC', '2025-05-26 05:42:54', NULL, NULL),
(6, '', 'preddy@gmail.com', 'Pr&111111', '2025-05-30 09:00:41', NULL, NULL),
(7, '', 'god@gmail.com', 'Gl&123445', '2025-06-03 08:08:30', NULL, NULL),
(8, '', 'mary@gmail.com', 'Gl&123445', '2025-06-03 08:22:58', NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `datasets`
--
ALTER TABLE `datasets`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `datasets`
--
ALTER TABLE `datasets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
